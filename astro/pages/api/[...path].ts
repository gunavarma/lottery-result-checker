import type { APIRoute } from 'astro';

/**
 * JSON 404 for every unmatched `/api/*` path.
 *
 * Without this, an unknown endpoint falls through to the site's HTML 404 page,
 * so an API client doing `await res.json()` gets a parse error instead of a
 * status it can read. The previous API surface answered JSON for unknown paths,
 * and that contract is worth keeping.
 *
 * Astro resolves static routes before dynamic ones and both before a rest
 * parameter, so this only ever runs for paths no real endpoint claims — the
 * `/api/live` and `/api/results/today` handlers are unaffected.
 */
export const ALL: APIRoute = ({ params, request }) => {
  const path = params.path ?? '';
  // A JSON parse failure on a request body is the one case the caller benefits
  // from hearing about specifically; everything else is "no such endpoint".
  const suffix = path ? `/${path}` : '';

  return Response.json(
    {
      success: false,
      error: `Endpoint not found: ${request.method} /api${suffix}`,
    },
    { status: 404 }
  );
};
