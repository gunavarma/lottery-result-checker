import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeData } from '@/lib/prisma';
import { denyUnauthorized } from '@/lib/security/auth';
import { getAutomationHealth } from '@/lib/lotis/health';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const denied = denyUnauthorized(request, 'admin');
    if (denied) return denied;

    // 1. Fetch counts in parallel
    const [
      lotteryCount,
      drawCount,
      prizeCount,
      winningNumberCount,
      newsCount,
      syncLogCount,
      importJobCount,
      importErrorCount,
    ] = await Promise.all([
      prisma.lottery.count(),
      prisma.draw.count(),
      prisma.prize.count(),
      prisma.winningNumber.count(),
      prisma.newsArticle.count(),
      prisma.syncLog.count(),
      prisma.importJob.count(),
      prisma.importError.count(),
    ]);

    // 2. Fetch latest records
    const [latestDraw, lastSyncLog, latestImportJob, latestNews] = await Promise.all([
      prisma.draw.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        include: { lottery: true },
      }),
      prisma.syncLog.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      prisma.importJob.findFirst({
        where: { jobType: 'HISTORICAL_BACKFILL' },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.newsArticle.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    // 3. Automation health / failure detection telemetry
    const automationHealth = await getAutomationHealth();

    // 4. Estimated database & storage footprint
    const estimatedDbBytes =
      lotteryCount * 300 +
      drawCount * 500 +
      prizeCount * 150 +
      winningNumberCount * 60 +
      newsCount * 2000;

    const estimatedDbSizeKb = Math.round(estimatedDbBytes / 1024);

    return NextResponse.json(
      serializeData({
        success: true,
        timestamp: new Date().toISOString(),
        systemHealth: automationHealth.status,
        automationHealth,
        automation: {
          continuousSyncEnabled: true,
          fcmNotificationsEnabled: true,
          cronProtectionActive: true,
          manualAdminSyncRequired: false,
        },
        counts: {
          lotteries: lotteryCount,
          draws: drawCount,
          prizes: prizeCount,
          winningNumbers: winningNumberCount,
          newsArticles: newsCount,
          syncLogs: syncLogCount,
          importJobs: importJobCount,
          importErrors: importErrorCount,
        },
        storage: {
          estimatedDatabaseSize: `${estimatedDbSizeKb} KB`,
          pdfStorageStrategy: 'URL + SHA256 Checksum (Zero DB PDF Blobs)',
          newsImageStrategy: 'Optimized CDN / WebP Metadata Only',
        },
        historicalImport: latestImportJob
          ? {
              status: latestImportJob.status,
              totalDiscovered: latestImportJob.totalItems,
              processed: latestImportJob.processedItems,
              successful: latestImportJob.successfulItems,
              failed: latestImportJob.failedItems,
              lastCursor: latestImportJob.lastCursor,
              updatedAt: latestImportJob.updatedAt,
            }
          : { status: 'NOT_STARTED' },
        latestResults: {
          latestPublishedDraw: latestDraw
            ? {
                lotteryName: latestDraw.lottery?.name || 'Kerala State Lottery',
                drawNumber: latestDraw.drawNumber,
                drawDate: latestDraw.drawDate.toISOString().split('T')[0],
                status: latestDraw.status,
                sourceDocumentUrl: latestDraw.sourceDocumentUrl,
              }
            : null,
          lastSyncTime: lastSyncLog?.completedAt || lastSyncLog?.startedAt || null,
          lastSyncStatus: lastSyncLog?.status || 'IDLE',
        },
        news: {
          totalArticles: newsCount,
          latestArticle: latestNews
            ? {
                title: latestNews.title,
                publishedAt: latestNews.publishedAt.toISOString().split('T')[0],
                sourceName: latestNews.sourceName,
              }
            : null,
        },
      })
    );
  } catch (error: any) {
    console.error('API /admin/system-status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'System status check failure' },
      { status: 500 }
    );
  }
}
