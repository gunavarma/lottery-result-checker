import { DrawPublishedEvent } from './types';
import { sendResultPublishedPushNotification, FcmDispatchSummary } from '@/lib/firebase/fcm';

/**
 * Dispatches draw published notifications via Firebase Cloud Messaging (FCM)
 */
export async function dispatchResultPublished(
  event: DrawPublishedEvent
): Promise<FcmDispatchSummary> {
  return await sendResultPublishedPushNotification(event);
}
