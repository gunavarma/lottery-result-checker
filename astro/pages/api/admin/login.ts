import type { APIRoute } from 'astro';
import {
  adminSessionCookie,
  clientKey,
  getAdminConfig,
  isSameOriginRequest,
  isSecureRequest,
  registerLoginAttempt,
  verifyAdminCredentials,
} from '@/lib/admin/session';

/**
 * Admin login.
 *
 * Accepts the login form (`application/x-www-form-urlencoded`) and JSON, so the
 * same endpoint works for the server-rendered form and for `curl`/scripts.
 *
 * Failure modes are intentionally indistinguishable to the caller: a wrong
 * username, a wrong password and an unknown user all redirect to the same
 * `?error=invalid`. The only distinct states are "rate limited" and "no
 * credential configured", both of which the operator needs to know.
 */

/** Only same-site admin paths are redirect targets (no open redirect). */
function safeNext(raw: string | null): string {
  if (!raw) return '/admin';
  if (!raw.startsWith('/admin')) return '/admin';
  if (raw.startsWith('//')) return '/admin';
  if (raw.startsWith('/admin/login')) return '/admin';
  return raw;
}

function redirect(location: string, headers: Record<string, string> = {}): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const config = getAdminConfig();
  const url = new URL(request.url);

  if (!config.configured && !config.devFallback) {
    // Distinguish "not set" from "set but rejected", so the operator knows
    // which one to fix.
    if (config.problem === 'weak-password') {
      return redirect('/admin/login?error=weak');
    }
    if (config.problem === 'malformed-hash') {
      return redirect('/admin/login?error=hash');
    }
    return redirect('/admin/login?error=config');
  }

  // A cross-site form post must not be able to log someone in.
  if (!isSameOriginRequest(request)) {
    return redirect('/admin/login?error=invalid');
  }

  let username = '';
  let password = '';
  let next: string | null = null;

  const contentType = request.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      username = String(body.username ?? '');
      password = String(body.password ?? '');
      next = typeof body.next === 'string' ? body.next : null;
    } else {
      const form = await request.formData();
      username = String(form.get('username') ?? '');
      password = String(form.get('password') ?? '');
      next = typeof form.get('next') === 'string' ? (form.get('next') as string) : null;
    }
  } catch {
    return redirect('/admin/login?error=invalid');
  }

  // Prefer the form's own `next`, then the query string the middleware added.
  const target = safeNext(next ?? url.searchParams.get('next'));
  const limit = registerLoginAttempt(clientKey(request));
  if (!limit.allowed) {
    return redirect(`/admin/login?error=rate&next=${encodeURIComponent(target)}`, {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }

  if (!verifyAdminCredentials(username, password)) {
    return redirect(`/admin/login?error=invalid&next=${encodeURIComponent(target)}`);
  }

  // `Secure` is required on a real deployment (a cookie sent over plain http
  // can be stolen), but it would also make the browser drop the cookie on a
  // local http preview, so it follows the protocol the request actually
  // arrived on.
  const session = adminSessionCookie({
    secure: process.env.NODE_ENV === 'production' || isSecureRequest(request),
  });
  cookies.set(session.name, session.value, session.options);

  return redirect(target);
};

/** The form posts here; a GET is not a login attempt. */
export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/login', 'Cache-Control': 'no-store' },
  });
};
