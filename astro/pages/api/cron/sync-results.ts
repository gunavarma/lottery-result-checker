import type { APIRoute } from 'astro';
import { syncOfficialResults } from '@/lib/lotis/sync';
import { requirePrivileged } from '@/lib/security/auth';
import { prisma } from '@/lib/prisma';
import { formatDateOnly } from '@/lib/date';
import { getAutomationHealth } from '@/lib/lotis/health';
import { SITE_URL } from '@/lib/site-url';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Fail-closed, constant-time authentication. Vercel Cron sends
    // `Authorization: Bearer $CRON_SECRET` automatically.
    const denied = await requirePrivileged(request, 'cron');
    if (denied) return denied;

    const force = new URL(request.url).searchParams.get('force') === 'true';
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10', 10);

    const result = await syncOfficialResults({
      maxItemsToSync: limit,
      forceRefresh: force,
    });

    const response = {
      success: result.success,
      newResults: result.newResults,
      updatedResults: result.updatedResults,
      skippedResults: result.skippedResults,
      recordsFound: result.recordsFound,
      message: result.message,
      errors: result.errors?.slice(0, 5),
      timestamp: result.timestamp,
      indexNow: undefined as { submitted: number; ok: boolean } | undefined,
      // Automation failure detection travels with the automation itself. There
      // is no admin dashboard, so the scheduler's own response is where a stalled
      // pipeline or a missing result has to surface.
      health: undefined as
        | { status: string; alerts: { code: string; severity: string; message: string }[] }
        | undefined,
    };

    try {
      const health = await getAutomationHealth();
      response.health = { status: health.status, alerts: health.alerts };

      if (health.status === 'CRITICAL') {
        console.error(
          `[sync-results] Automation health CRITICAL: ${health.alerts
            .map((alert) => `${alert.code} (${alert.message})`)
            .join(' | ')}`
        );
      }
    } catch (healthErr) {
      console.warn('[sync-results] Automation health unavailable:', healthErr);
    }

    // Search-engine pings: when gazette-verified pages changed, tell IndexNow
    // (Bing's index — which several AI answer engines read) so new/updated
    // result pages are picked up within minutes instead of days.
    if (result.success && (result.newResults > 0 || result.updatedResults > 0)) {
      try {
        const recent = await prisma.draw.findMany({
          where: {
            status: 'PUBLISHED',
            verificationLevel: 'OFFICIAL',
            updatedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
          select: { drawDate: true },
          distinct: ['drawDate'],
        });
        const changedUrls = recent.map((d) => `/kerala-lottery-result/${formatDateOnly(d.drawDate)}`);
        if (changedUrls.length > 0) {
          const base = SITE_URL;
          const ping = await fetch(`${base}/api/indexnow`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''}`,
            },
            body: JSON.stringify({ urls: changedUrls }),
            signal: AbortSignal.timeout(10_000),
          }).catch(() => null);
          if (ping?.ok) {
            const payload = await ping.json().catch(() => null);
            response.indexNow = {
              submitted: payload?.submitted ?? changedUrls.length,
              ok: true,
            };
          }
        }
      } catch (pingErr) {
        console.warn('[sync-results] IndexNow ping skipped:', pingErr);
      }
    }

    return Response.json(response);
  } catch (error: any) {
    console.error('Error in /api/cron/sync-results:', error);
    return Response.json(
      {
        success: false,
        newResults: 0,
        updated: false,
        error: error.message || 'Internal cron synchronization failure',
      },
      { status: 500 }
    );
  }
};
