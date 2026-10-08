import type { APIContext } from 'astro';

/**
 * Calls an Astro `APIRoute` the way the Astro runtime does.
 *
 * Astro hands a route handler a single `APIContext` object carrying `request`,
 * `params` and the response helpers — it is not given a bare `Request` the way
 * a Next.js handler was. Tests only care about the request side, so this builds
 * the smallest context that satisfies the real contract, which keeps the
 * handlers under test exactly as they ship.
 */
export function callRoute(
  handler: (context: APIContext) => Response | Promise<Response>,
  request: Request,
  params: Record<string, string | undefined> = {}
): Promise<Response> {
  return Promise.resolve(handler({ request, params } as unknown as APIContext));
}
