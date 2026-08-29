export type NotificationChannel = 'PUSH' | 'EMAIL' | 'WHATSAPP';

export interface DrawPublishedEvent {
  drawId: string;
  lotteryId: string;
  lotteryName: string;
  lotteryCode: string;
  drawNumber: string;
  drawDate: string; // e.g. "2026-08-28"
  drawTime: string;
  firstPrizeAmountFormatted: string; // e.g. "₹1,00,00,000"
  firstPrizeTicket?: string; // e.g. "PS 320327"
  resultUrl: string; // e.g. "https://keraladraws.com/result/2026-08-28/suvarna-keralam"
}

export interface NotificationSendResult {
  channel: NotificationChannel;
  subscriptionId: string;
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  isEnabled(): boolean;
  send(subscription: any, event: DrawPublishedEvent): Promise<NotificationSendResult>;
}
