'use client';

/**
 * Astro island wrapper for Ticket verification terminal.
 *
 * One module per island on purpose. When every wrapper lived in a single barrel,
 * the module-level `withProviders(...)` calls could not be tree-shaken, so the
 * whole barrel became one shared chunk and every page downloaded every island
 * (including the QR scanner). Separate modules let Rollup give each route only
 * the islands it actually renders.
 */
import { withProviders } from '@/components/with-providers';
import { TicketChecker } from '@/components/TicketChecker';

export const TicketCheckerIsland = withProviders(TicketChecker);
