/**
 * Legacy alias for `/api/tickets/check`.
 *
 * Kept because older clients and bookmarks call the singular path; both names
 * resolve to the same handler, so there is no second implementation to drift.
 */
export { GET, POST } from './../tickets/check';
