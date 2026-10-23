import type { APIRoute } from 'astro';
import { ADMIN_SESSION_COOKIE, readSessionFromRequest, revokeSessionToken } from '@/lib/admin/session';

/**
 * Admin logout.
 *
 * POST only: a GET logout can be triggered by any image tag on any site, which
 * would let a third party sign the operator out at will. The cookie is cleared
 * with the same attributes it was set with, otherwise the browser keeps it.
 *
 * Clearing the cookie is not enough on its own — a copy of the cookie value
 * would still be a valid, signed session until it expired. The session id is
 * therefore revoked server-side as well, so the sign-out really ends the
 * session for this instance.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  revokeSessionToken(readSessionFromRequest(request));
  cookies.delete(ADMIN_SESSION_COOKIE, { path: '/' });
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/login?loggedout=1', 'Cache-Control': 'no-store' },
  });
};
