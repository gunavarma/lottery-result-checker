export interface WinningNumberDTO {
  id?: string;
  series: string | null;
  number: string;
  displayNumber: string;
  location: string | null;
  isEndingOnly: boolean;
}

export interface PrizeDTO {
  id?: string;
  category: string;
  tierNumber: number | null;
  description: string | null;
  amount: number; // in INR
  orderIndex: number;
  winningNumbers: WinningNumberDTO[];
}

export interface DrawDTO {
  id: string;
  lotteryId: string;
  drawNumber: string;
  drawDate: string; // ISO date string YYYY-MM-DD
  drawTime: string;
  status: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED';
  sourceUrl: string | null;
  sourceItemId: string | null;
  publishedAt: string | null;
  lastCheckedAt: string;
  lottery?: LotteryDTO;
  prizes?: PrizeDTO[];
}

export interface LotteryDTO {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  drawDay: string;
  drawTime: string;
  ticketPrice: number;
  firstPrizeAmount: number;
  active: boolean;
  isBumper: boolean;
  latestDraw?: DrawDTO | null;
}

export interface SyncResult {
  success: boolean;
  recordsFound: number;
  newDrawsCount: number;
  updatedDrawsCount: number;
  errors?: string[];
  message: string;
  timestamp: string;
}

export interface LOTISScrapedItem {
  slNo: number;
  title: string;
  drawDate: string; // e.g. "27-08-2026"
  itemId: string;
  lotteryName: string;
  drawNumber: string;
  drawCode: string;
}
