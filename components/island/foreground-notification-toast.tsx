'use client';

/**
 * Astro island wrapper for FCM foreground notification toast.
 *
 * Does not require withProviders as it uses no react-query or translation context.
 */
import { ForegroundNotificationToast } from '@/components/ForegroundNotificationToast';

export const ForegroundNotificationToastIsland = ForegroundNotificationToast;
