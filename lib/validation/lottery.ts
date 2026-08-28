import { z } from 'zod';

export const WinningNumberSchema = z.object({
  series: z.string().nullable().optional(),
  number: z.string().min(4).max(6).regex(/^[0-9]+$/, 'Winning ticket number must be digits only'),
  displayNumber: z.string().min(4),
  location: z.string().nullable().optional(),
});

export const PrizeSchema = z.object({
  category: z.string().min(2, 'Prize category name required'),
  tierNumber: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nonnegative('Prize amount must be non-negative'),
  orderIndex: z.number().int().nonnegative().default(0),
  winningNumbers: z.array(WinningNumberSchema).min(1, 'Prize tier must have at least 1 winning number'),
});

export const ParsedDrawResultSchema = z.object({
  lotteryName: z.string().min(2, 'Lottery name is required'),
  lotteryCode: z.string().min(1, 'Lottery code is required'),
  drawNumber: z.string().min(2, 'Draw number is required'),
  drawDate: z.date(),
  drawDateFormatted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Draw date format must be YYYY-MM-DD'),
  drawTime: z.string().default('3:00 PM'),
  venue: z.string().nullable().optional(),
  sourceUrl: z.string().url('Must be valid official LOTIS URL'),
  sourceDocumentUrl: z.string().url('Must be valid official PDF URL').optional(),
  sourceItemId: z.string().optional(),
  prizes: z.array(PrizeSchema).min(1, 'Draw must contain at least 1 prize tier (1st Prize)'),
  totalWinningNumbers: z.number().int().positive(),
  rawText: z.string().min(50),
});

export const HistoryQuerySchema = z.object({
  lottery: z.string().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query must not be empty').max(100),
});
