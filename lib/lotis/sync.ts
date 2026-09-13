import { PDFParse } from 'pdf-parse';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import {
  parseLotisPdfText,
  standardizeLotteryName,
  getLotterySlug,
} from '../parser/lotis-parser';
import { ParsedDrawResultSchema } from '../validation/lottery';
import { persistParsedDraw } from '../results/persist';
import { invalidateCache } from '../cache';

export const LOTIS_BASE_URL = 'https://www.lotteryagent.kerala.gov.in';
export const LOTIS_PUBLIC_URL = `${LOTIS_BASE_URL}/result/public`;

export interface LOTISScrapedItem {
  slNo: number;
  title: string;
  drawDate: string; // e.g. "27-08-2026"
  itemId: string;
  lotteryName: string;
  drawNumber: string;
  drawCode: string;
}

export interface SyncResponse {
  success: boolean;
  newResults: number;
  updatedResults: number;
  skippedResults: number;
  recordsFound: number;
  message: string;
  errors?: string[];
  timestamp: string;
}

/**
 * Fetch draw list from official LOTIS portal
 */
export async function fetchLotisDrawList(): Promise<LOTISScrapedItem[]> {
  let lastErr: any = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(LOTIS_PUBLIC_URL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`LOTIS server returned HTTP ${res.status}`);
      }

      const html = await res.text();
      return parseLotisTableHtml(html);
    } catch (error: any) {
      clearTimeout(timeout);
      lastErr = error;
      console.warn(`[Sync] fetchLotisDrawList attempt ${attempt} failed:`, error?.message || error);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastErr || new Error('Failed to fetch draw list from LOTIS after 3 attempts');
}

/**
 * Parse table rows from official LOTIS HTML page
 */
export function parseLotisTableHtml(html: string): LOTISScrapedItem[] {
  const items: LOTISScrapedItem[] = [];

  const rowRegex = /<td>\s*(\d+)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*(\d{1,2}-\d{1,2}-\d{4})\s*<\/td>\s*<td>[\s\S]*?data-item-id="([a-f0-9-]+)"/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(html)) !== null) {
    const slNo = parseInt(match[1], 10);
    const rawTitle = match[2].trim();
    const drawDate = match[3].trim();
    const itemId = match[4].trim();

    let lotteryName = rawTitle;
    let drawNumber = '';
    let drawCode = '';

    const drawNumMatch = rawTitle.match(/\(([A-Z0-9-]+)\)/i);
    if (drawNumMatch) {
      drawNumber = drawNumMatch[1].trim();
      const codeMatch = drawNumber.match(/^([A-Z0-9]+)/i);
      if (codeMatch) drawCode = codeMatch[1].toUpperCase();
    }

    const nameMatch = rawTitle.match(/^([A-Z0-9\s'-]+?)(?:-\d{1,2}\/\d{1,2}\/\d{4}|\s*\()/i);
    if (nameMatch) {
      lotteryName = nameMatch[1].trim();
    }

    items.push({
      slNo,
      title: rawTitle,
      drawDate,
      itemId,
      lotteryName: standardizeLotteryName(lotteryName),
      drawNumber,
      drawCode,
    });
  }

  return items;
}

/**
 * Download and parse official PDF result document
 */
export async function downloadAndParseLotisResult(itemId: string) {
  const downloadUrl = `${LOTIS_BASE_URL}/results/${itemId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(downloadUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Failed to download official result document: HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute checksum to detect changes without storing huge binary blobs in DB
    const sourceHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();

    const parsed = parseLotisPdfText(pdfData.text);
    if (!parsed) {
      throw new Error(`Failed to parse structured lottery result from PDF document for item ${itemId}`);
    }

    return {
      parsed,
      sourceHash,
      sourceUrl: LOTIS_PUBLIC_URL,
      sourceDocumentUrl: downloadUrl,
      sourceItemId: itemId,
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Main Synchronization Service for official LOTIS results
 */
export async function syncOfficialResults(options: { maxItemsToSync?: number; forceRefresh?: boolean; checkGaps?: boolean } = {}): Promise<SyncResponse> {
  const startedAt = new Date();
  const maxItems = options.maxItemsToSync ?? 10;
  const errors: string[] = [];
  let newResults = 0;
  let updatedResults = 0;
  let skippedResults = 0;

  // Create audit log and sync run
  let syncLogId: string | null = null;
  let syncRunId: string | null = null;
  try {
    const [log, run] = await Promise.all([
      prisma.syncLog.create({
        data: {
          source: 'LOTIS (Directorate of Kerala State Lotteries)',
          startedAt,
          status: 'RUNNING',
        },
      }),
      prisma.syncRun.create({
        data: {
          jobName: 'SYNC_RESULTS',
          startedAt,
          status: 'RUNNING',
        },
      }),
    ]);
    syncLogId = log.id;
    syncRunId = run.id;
  } catch (err) {
    console.warn('Unable to create initial audit entries:', err);
  }

  try {
    const scrapedList = await fetchLotisDrawList();

    if (!scrapedList || scrapedList.length === 0) {
      if (syncLogId) {
        await prisma.syncLog.update({
          where: { id: syncLogId },
          data: {
            completedAt: new Date(),
            status: 'NO_NEW_DATA',
            recordsFound: 0,
            errorMessage: 'No draws returned from LOTIS table',
          },
        });
      }
      if (syncRunId) {
        await prisma.syncRun.update({
          where: { id: syncRunId },
          data: {
            completedAt: new Date(),
            status: 'NO_NEW_DATA',
            itemsChecked: 0,
            itemsCreated: 0,
            itemsUpdated: 0,
            itemsFailed: 0,
          },
        });
      }
      return {
        success: true,
        newResults: 0,
        updatedResults: 0,
        skippedResults: 0,
        recordsFound: 0,
        message: 'No draw records found on official LOTIS portal',
        timestamp: new Date().toISOString(),
      };
    }

    // Process recent items
    const itemsToProcess = scrapedList.slice(0, maxItems);

    for (const item of itemsToProcess) {
      try {
        // Idempotency check. Draw uniqueness is [lotteryId, drawNumber], so a
        // bare drawNumber match across schemes could wrongly skip a legitimate
        // new draw. Scope the match to the scheme that owns this item.
        const candidateSlug = getLotterySlug(item.lotteryName, item.drawCode);
        const candidateLottery = await prisma.lottery.findUnique({
          where: { slug: candidateSlug },
          select: { id: true },
        });

        const duplicateConditions: Prisma.DrawWhereInput[] = [
          { sourceItemId: item.itemId },
        ];
        if (candidateLottery && item.drawNumber) {
          duplicateConditions.push({
            lotteryId: candidateLottery.id,
            drawNumber: item.drawNumber,
          });
        }

        const existingDraw = await prisma.draw.findFirst({
          where: { OR: duplicateConditions },
          select: { id: true, verificationLevel: true },
        });

        // Skip only a gazette-verified record. A PROVISIONAL row published by
        // the live aggregator must NOT be skipped: the official gazette has to
        // be able to upgrade it. Skipping here also avoids downloading and
        // parsing a PDF we already hold officially.
        if (existingDraw?.verificationLevel === 'OFFICIAL' && !options.forceRefresh) {
          skippedResults++;
          continue;
        }

        // Fetch official result document
        const { parsed, sourceHash, sourceUrl, sourceDocumentUrl, sourceItemId } = await downloadAndParseLotisResult(item.itemId);

        // Zod validation
        const validationResult = ParsedDrawResultSchema.safeParse({
          ...parsed,
          sourceUrl,
          sourceDocumentUrl,
          sourceItemId,
        });

        if (!validationResult.success) {
          throw new Error(`Validation failed for ${item.title}: ${validationResult.error.message}`);
        }

        const validData = validationResult.data;

        // Single shared writer: trust-tier rules, transactional prize
        // replacement and notification dispatch all live in one place.
        const outcome = await persistParsedDraw({
          parsed: validData,
          provider: 'LOTIS',
          verificationLevel: 'OFFICIAL',
          sourceUrl,
          sourceDocumentUrl,
          sourceItemId,
          sourceHash,
          forceRefresh: options.forceRefresh,
          notify: true,
        });

        if (outcome.status === 'SKIPPED') {
          skippedResults++;
        } else if (outcome.status === 'CREATED') {
          newResults++;
        } else {
          updatedResults++;
        }
      } catch (itemErr: any) {
        console.error(`Error processing LOTIS item ${item.itemId} (${item.title}):`, itemErr);
        errors.push(`${item.title}: ${itemErr.message || itemErr}`);

        // Record in ImportError table
        try {
          await prisma.importError.create({
            data: {
              sourceIdentifier: item.itemId,
              errorType: 'PARSE_OR_VALIDATION_ERROR',
              errorMessage: itemErr.message || String(itemErr),
              status: 'PENDING',
            },
          });
        } catch (dbErr) {
          console.warn('Could not record ImportError:', dbErr);
        }
      }
    }

    const completedAt = new Date();
    const finalStatus = errors.length > 0 && newResults === 0 && updatedResults === 0 ? 'FAILED' : 'SUCCESS';

    // Invalidate in-memory cache if new or updated results were written
    if (newResults > 0 || updatedResults > 0) {
      try {
        invalidateCache();
      } catch (cacheErr) {
        console.warn('Cache invalidation error:', cacheErr);
      }
    }

    // Complete audit records
    if (syncLogId) {
      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          completedAt,
          status: finalStatus,
          recordsFound: scrapedList.length,
          newDrawsCount: newResults,
          errorMessage: errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
        },
      });
    }

    if (syncRunId) {
      await prisma.syncRun.update({
        where: { id: syncRunId },
        data: {
          completedAt,
          status: finalStatus,
          itemsChecked: itemsToProcess.length,
          itemsCreated: newResults,
          itemsUpdated: updatedResults,
          itemsFailed: errors.length,
          errorSummary: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
        },
      });
    }

    return {
      success: finalStatus === 'SUCCESS',
      newResults,
      updatedResults,
      skippedResults,
      recordsFound: scrapedList.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Official Kerala State Lottery sync complete: ${newResults} new, ${updatedResults} updated, ${skippedResults} skipped.`,
      timestamp: completedAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Fatal synchronization error:', error);
    if (syncLogId) {
      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          completedAt: new Date(),
          status: 'FAILED',
          errorMessage: error.message || 'Fatal error',
        },
      });
    }
    if (syncRunId) {
      await prisma.syncRun.update({
        where: { id: syncRunId },
        data: {
          completedAt: new Date(),
          status: 'FAILED',
          errorSummary: error.message || 'Fatal error',
        },
      });
    }
    return {
      success: false,
      newResults: 0,
      updatedResults: 0,
      skippedResults: 0,
      recordsFound: 0,
      errors: [error.message || 'Fatal error'],
      message: `Sync failed: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    };
  }
}


