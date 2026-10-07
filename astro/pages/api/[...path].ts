import type { APIRoute } from 'astro';

// Map of static API route paths to their existing Next.js route handlers
const ROUTE_MODULES: Record<string, () => Promise<any>> = {
  'results/today': () => import('@/app/api/results/today/route'),
  'results/latest': () => import('@/app/api/results/latest/route'),
  'results/history': () => import('@/app/api/results/history/route'),
  'results/dates': () => import('@/app/api/results/dates/route'),
  'search': () => import('@/app/api/search/route'),
  'tickets/check': () => import('@/app/api/tickets/check/route'),
  'tickets/watchlist': () => import('@/app/api/tickets/watchlist/route'),
  'ticket/check': () => import('@/app/api/ticket/check/route'),
  'lotteries': () => import('@/app/api/lotteries/route'),
  'live': () => import('@/app/api/live/route'),
  'news': () => import('@/app/api/news/route'),
  'cron/sync-results': () => import('@/app/api/cron/sync-results/route'),
  'cron/sync-news': () => import('@/app/api/cron/sync-news/route'),
  'cron/sync-live': () => import('@/app/api/cron/sync-live/route'),
  'cron/historical-backfill': () => import('@/app/api/cron/historical-backfill/route'),
  'cron/keralalotteries-backfill': () => import('@/app/api/cron/keralalotteries-backfill/route'),
  'notifications/register': () => import('@/app/api/notifications/register/route'),
  'notifications/subscribe': () => import('@/app/api/notifications/subscribe/route'),
  'notifications/dispatch': () => import('@/app/api/notifications/dispatch/route'),
  'notifications/test': () => import('@/app/api/notifications/test/route'),
  'indexnow': () => import('@/app/api/indexnow/route'),
};

export const ALL: APIRoute = async ({ params, request }) => {
  const path = params.path || '';
  const method = request.method;

  // Polyfill nextUrl for handlers expecting NextRequest
  const url = new URL(request.url);
  (request as any).nextUrl = url;

  let modLoader = ROUTE_MODULES[path];
  let routeParams: Record<string, string> = {};

  if (!modLoader) {
    const parts = path.split('/');
    if (parts[0] === 'results' && parts[1] === 'date' && parts[2]) {
      modLoader = () => import('@/app/api/results/date/[date]/route');
      routeParams = { date: parts[2] };
    } else if (parts[0] === 'results' && parts[1] === 'lottery' && parts[2] && parts[3]) {
      modLoader = () => import('@/app/api/results/lottery/[lottery]/[drawNumber]/route');
      routeParams = { lottery: parts[2], drawNumber: parts[3] };
    } else if (parts[0] === 'results' && parts[1] === 'lottery' && parts[2]) {
      modLoader = () => import('@/app/api/results/lottery/[lottery]/route');
      routeParams = { lottery: parts[2] };
    } else if (parts[0] === 'results' && parts[1] && parts[2]) {
      modLoader = () => import('@/app/api/results/[id]/[drawNumber]/route');
      routeParams = { id: parts[1], drawNumber: parts[2] };
    } else if (parts[0] === 'results' && parts[1]) {
      modLoader = () => import('@/app/api/results/[id]/route');
      routeParams = { id: parts[1] };
    } else if (parts[0] === 'lotteries' && parts[1]) {
      modLoader = () => import('@/app/api/lotteries/[slug]/route');
      routeParams = { slug: parts[1] };
    } else if (parts[0] === 'news' && parts[1]) {
      modLoader = () => import('@/app/api/news/[slug]/route');
      routeParams = { slug: parts[1] };
    }
  }

  if (!modLoader) {
    return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const mod = await modLoader();
    const handler = mod[method] || mod.ALL;

    if (typeof handler !== 'function') {
      return new Response(JSON.stringify({ success: false, error: `Method ${method} not allowed` }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await handler(request, { params: Promise.resolve(routeParams) });
    return res;
  } catch (err: any) {
    console.error(`API Error on /api/${path}:`, err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
