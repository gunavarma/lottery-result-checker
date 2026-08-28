// Supabase Edge Function: check-lottery-results
// Scheduled via Supabase Cron (pg_cron) every 15 minutes
// Authoritative Data Source: Official LOTIS Portal (Directorate of Kerala State Lotteries)
// Zero-Emoji & Idempotent Execution

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const LOTIS_BASE_URL = Deno.env.get('LOTIS_BASE_URL') || 'https://www.lotteryagent.kerala.gov.in';
const LOTIS_PUBLIC_URL = `${LOTIS_BASE_URL}/result/public/`;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
const APP_URL = Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';

interface ScrapedItem {
  slNo: number;
  title: string;
  drawDate: string; // "DD-MM-YYYY"
  itemId: string;
  lotteryName: string;
  drawNumber: string;
  drawCode: string;
}

interface ParsedPrize {
  category: string;
  description?: string;
  amount: number;
  orderIndex: number;
  winningNumbers: {
    series?: string;
    number: string;
    displayNumber: string;
    location?: string;
  }[];
}

interface ParsedDraw {
  lotteryName: string;
  lotteryCode: string;
  drawNumber: string;
  drawDate: string; // ISO string YYYY-MM-DD
  drawDateFormatted: string; // DD-MM-YYYY
  drawTime: string;
  prizes: ParsedPrize[];
  rawText?: string;
}

function standardizeLotteryName(rawName: string): string {
  const clean = rawName.replace(/LOTTERY|RESULT|KERALA STATE/gi, '').trim();
  if (/suvarna/i.test(clean)) return 'Suvarna Keralam';
  if (/karunya\s*plus/i.test(clean)) return 'Karunya Plus';
  if (/karunya/i.test(clean)) return 'Karunya';
  if (/sthree\s*sakthi/i.test(clean)) return 'Sthree Sakthi';
  if (/fifty\s*fifty|50-50/i.test(clean)) return 'Fifty Fifty';
  if (/nirmal/i.test(clean)) return 'Nirmal';
  if (/win-win|win\s*win/i.test(clean)) return 'Win-Win';
  if (/akshaya/i.test(clean)) return 'Akshaya';
  if (/bhagyamithra/i.test(clean)) return 'Bhagyamithra';
  if (/thiruvonam/i.test(clean)) return 'Thiruvonam Bumper';
  if (/vishu/i.test(clean)) return 'Vishu Bumper';
  if (/pooja/i.test(clean)) return 'Pooja Bumper';
  if (/monsoon/i.test(clean)) return 'Monsoon Bumper';
  if (/summer/i.test(clean)) return 'Summer Bumper';
  if (/xmas|christmas/i.test(clean)) return 'Xmas New Year Bumper';
  return clean || rawName;
}

function getLotterySlug(name: string, code: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return base || code.toLowerCase();
}

function parseLotisTableHtml(html: string): ScrapedItem[] {
  const items: ScrapedItem[] = [];
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

// Simple deterministic text parser for official result text
function parseResultText(text: string, defaultName: string, defaultNumber: string, defaultDate: string): ParsedDraw | null {
  if (!text || text.length < 50) return null;

  const dateMatch = text.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  let isoDate = new Date().toISOString().split('T')[0];
  let formattedDate = defaultDate;

  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    isoDate = `${year}-${month}-${day}`;
    formattedDate = `${day}-${month}-${year}`;
  }

  const drawNumMatch = text.match(/([A-Z]{1,4}-\d{2,5})/i);
  const drawNumber = drawNumMatch ? drawNumMatch[1].toUpperCase() : defaultNumber;
  const drawCode = drawNumber.split('-')[0] || 'KL';

  // Extract winning numbers for 1st Prize
  const prizes: ParsedPrize[] = [];
  const firstPrizeMatch = text.match(/1st\s*Prize[\s\S]*?([A-Z]{2}\s*\d{6})/i);
  
  if (firstPrizeMatch) {
    const firstTicket = firstPrizeMatch[1].replace(/\s+/, ' ').trim();
    const series = firstTicket.substring(0, 2);
    const num = firstTicket.substring(2).trim();

    // Check location
    let location: string | undefined;
    const locMatch = text.match(/1st\s*Prize[\s\S]*?(?:THIRUVANANTHAPURAM|KOLLAM|PATHANAMTHITTA|ALAPPUZHA|KOTTAYAM|IDUKKI|ERNAKULAM|THRISSUR|PALAKKAD|MALAPPURAM|KOZHIKODE|WAYANAD|KANNUR|KASARAGOD)/i);
    if (locMatch) location = locMatch[0].trim();

    prizes.push({
      category: '1st Prize',
      amount: 10000000,
      orderIndex: 0,
      winningNumbers: [{
        series,
        number: num,
        displayNumber: firstTicket,
        location,
      }],
    });
  }

  // Extract Consolation Prizes
  const consMatches = [...text.matchAll(/Consolation\s*Prize[\s\S]*?([A-Z]{2}\s*\d{6})/gi)];
  if (consMatches.length > 0) {
    const consNumbers = consMatches.map((m) => {
      const t = m[1].replace(/\s+/, ' ').trim();
      return {
        series: t.substring(0, 2),
        number: t.substring(2).trim(),
        displayNumber: t,
      };
    });

    prizes.push({
      category: 'Consolation Prize',
      amount: 8000,
      orderIndex: 1,
      winningNumbers: consNumbers,
    });
  }

  // Extract Lower Tier Ending Digits
  const lowerTiers = [
    { name: '2nd Prize', regex: /2nd\s*Prize[\s\S]*?([A-Z]{2}\s*\d{6}|\d{6})/i, amount: 1000000, order: 2 },
    { name: '3rd Prize', regex: /3rd\s*Prize[\s\S]*?(\d{4,6})/gi, amount: 500000, order: 3 },
    { name: '4th Prize', regex: /4th\s*Prize[\s\S]*?(\d{4})/gi, amount: 5000, order: 4 },
    { name: '5th Prize', regex: /5th\s*Prize[\s\S]*?(\d{4})/gi, amount: 2000, order: 5 },
    { name: '6th Prize', regex: /6th\s*Prize[\s\S]*?(\d{4})/gi, amount: 1000, order: 6 },
    { name: '7th Prize', regex: /7th\s*Prize[\s\S]*?(\d{4})/gi, amount: 500, order: 7 },
    { name: '8th Prize', regex: /8th\s*Prize[\s\S]*?(\d{4})/gi, amount: 100, order: 8 },
  ];

  for (const tier of lowerTiers) {
    const matches = [...text.matchAll(tier.regex)];
    if (matches.length > 0) {
      const wins = matches.slice(0, 50).map((m) => {
        const raw = m[1].trim();
        return {
          number: raw.replace(/[^0-9]/g, ''),
          displayNumber: raw,
        };
      });

      if (wins.length > 0) {
        prizes.push({
          category: tier.name,
          amount: tier.amount,
          orderIndex: tier.order,
          winningNumbers: wins,
        });
      }
    }
  }

  if (prizes.length === 0) return null;

  return {
    lotteryName: defaultName,
    lotteryCode: drawCode,
    drawNumber,
    drawDate: isoDate,
    drawDateFormatted: formattedDate,
    drawTime: '3:00 PM',
    prizes,
    rawText: text.substring(0, 5000),
  };
}

Deno.serve(async (req: Request) => {
  const startedAt = new Date();

  // Authentication validation
  const authHeader = req.headers.get('Authorization');
  if (CRON_SECRET) {
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    if (token !== CRON_SECRET && token !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid authentication credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase credentials are not configured in edge runtime' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Create SyncLog entry
  let syncLogId: string | null = null;
  try {
    const { data: logData } = await supabase
      .from('SyncLog')
      .insert({
        id: crypto.randomUUID(),
        source: 'LOTIS (Directorate of Kerala State Lotteries)',
        startedAt: startedAt.toISOString(),
        status: 'RUNNING',
      })
      .select('id')
      .single();

    if (logData) syncLogId = logData.id;
  } catch (err) {
    console.warn('Could not record initial SyncLog:', err);
  }

  let recordsFound = 0;
  let newResults = 0;
  let updatedResults = 0;
  let skippedResults = 0;
  const errors: string[] = [];

  try {
    // 2. Fetch LOTIS table
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const lotisRes = await fetch(LOTIS_PUBLIC_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!lotisRes.ok) {
      throw new Error(`Official LOTIS portal returned HTTP ${lotisRes.status}`);
    }

    const html = await lotisRes.text();
    const items = parseLotisTableHtml(html);
    recordsFound = items.length;

    if (items.length === 0) {
      if (syncLogId) {
        await supabase.from('SyncLog').update({
          completedAt: new Date().toISOString(),
          status: 'NO_NEW_DATA',
          recordsFound: 0,
          errorMessage: 'No table items found in LOTIS response',
        }).eq('id', syncLogId);
      }

      return new Response(JSON.stringify({
        success: true,
        newResults: 0,
        recordsFound: 0,
        message: 'No draw items available on LOTIS portal',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Process top 5 items
    for (const item of items.slice(0, 5)) {
      try {
        // Check if draw already exists in database
        const { data: existingDraw } = await supabase
          .from('Draw')
          .select('id, status')
          .or(`sourceItemId.eq.${item.itemId},drawNumber.eq.${item.drawNumber}`)
          .maybeSingle();

        if (existingDraw && existingDraw.status === 'PUBLISHED') {
          skippedResults++;
          continue;
        }

        // Fetch document
        const downloadUrl = `${LOTIS_BASE_URL}/results/${item.itemId}`;
        const docController = new AbortController();
        const docTimeout = setTimeout(() => docController.abort(), 15000);

        const docRes = await fetch(downloadUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
          signal: docController.signal,
        });
        clearTimeout(docTimeout);

        if (!docRes.ok) {
          throw new Error(`Failed downloading result item ${item.itemId}: HTTP ${docRes.status}`);
        }

        const docText = await docRes.text();
        const parsed = parseResultText(docText, item.lotteryName, item.drawNumber, item.drawDate);

        if (!parsed || parsed.prizes.length === 0) {
          throw new Error(`Could not parse winning tiers for ${item.title}`);
        }

        const slug = getLotterySlug(parsed.lotteryName, parsed.lotteryCode);
        const isBumper = slug.includes('bumper');

        // Upsert Lottery scheme
        const { data: lottery, error: lotErr } = await supabase
          .from('Lottery')
          .upsert({
            name: parsed.lotteryName,
            slug,
            code: parsed.lotteryCode,
            drawDay: 'Daily / Weekly',
            drawTime: parsed.drawTime || '3:00 PM',
            isBumper,
            ticketPrice: isBumper ? 300 : 40,
            active: true,
            updatedAt: new Date().toISOString(),
          }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (lotErr || !lottery) {
          throw new Error(`Failed upserting lottery ${slug}: ${lotErr?.message}`);
        }

        let drawId = existingDraw?.id;

        if (drawId) {
          // Delete existing prize rows for atomic replacement
          await supabase.from('Prize').delete().eq('drawId', drawId);

          await supabase.from('Draw').update({
            lotteryId: lottery.id,
            drawNumber: parsed.drawNumber,
            drawDate: new Date(parsed.drawDate).toISOString(),
            status: 'PUBLISHED',
            sourceUrl: LOTIS_PUBLIC_URL,
            sourceDocumentUrl: downloadUrl,
            sourceItemId: item.itemId,
            rawText: parsed.rawText,
            publishedAt: new Date(parsed.drawDate).toISOString(),
            lastCheckedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).eq('id', drawId);

          updatedResults++;
        } else {
          drawId = crypto.randomUUID();
          await supabase.from('Draw').insert({
            id: drawId,
            lotteryId: lottery.id,
            drawNumber: parsed.drawNumber,
            drawDate: new Date(parsed.drawDate).toISOString(),
            drawTime: parsed.drawTime || '3:00 PM',
            status: 'PUBLISHED',
            sourceUrl: LOTIS_PUBLIC_URL,
            sourceDocumentUrl: downloadUrl,
            sourceItemId: item.itemId,
            rawText: parsed.rawText,
            publishedAt: new Date(parsed.drawDate).toISOString(),
            lastCheckedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          newResults++;
        }

        // Insert Prizes & Winning numbers
        for (const p of parsed.prizes) {
          const prizeId = crypto.randomUUID();
          await supabase.from('Prize').insert({
            id: prizeId,
            drawId,
            category: p.category,
            description: p.description,
            amount: p.amount,
            orderIndex: p.orderIndex,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          if (p.winningNumbers && p.winningNumbers.length > 0) {
            const winRows = p.winningNumbers.map((w) => ({
              id: crypto.randomUUID(),
              prizeId,
              series: w.series || null,
              number: w.number,
              displayNumber: w.displayNumber,
              location: w.location || null,
              createdAt: new Date().toISOString(),
            }));

            await supabase.from('WinningNumber').insert(winRows);
          }
        }

        // Check TicketWatchlist matches
        try {
          const { data: watched } = await supabase
            .from('TicketWatchlist')
            .select('id, ticketNumber, series, userId')
            .eq('lotteryId', lottery.id)
            .eq('active', true);

          if (watched && watched.length > 0) {
            for (const item of watched) {
              const isMatch = parsed.prizes.some((p) =>
                p.winningNumbers.some((w) => {
                  if (item.ticketNumber.length === 6) {
                    const numMatch = w.number === item.ticketNumber;
                    const seriesMatch = !item.series || !w.series || w.series.toUpperCase() === item.series.toUpperCase();
                    return numMatch && seriesMatch;
                  } else if (item.ticketNumber.length === 4) {
                    return w.number.endsWith(item.ticketNumber);
                  }
                  return false;
                })
              );

              if (isMatch) {
                console.log(`[Watchlist Match] Watched ticket ${item.ticketNumber} won in ${parsed.drawNumber}!`);
              }
            }
          }
        } catch (watchErr) {
          console.warn('Watchlist evaluation error:', watchErr);
        }

        // Trigger FCM notification webhook on new draw publication
        if (APP_URL) {
          try {
            const firstPrize = parsed.prizes.find((p) => p.orderIndex === 0);
            const firstWinner = firstPrize?.winningNumbers?.[0];
            await fetch(`${APP_URL}/api/notifications/dispatch`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                drawId,
                lotteryId: lottery.id,
                lotteryName: parsed.lotteryName,
                lotteryCode: parsed.lotteryCode,
                drawNumber: parsed.drawNumber,
                drawDate: parsed.drawDateFormatted,
                drawTime: parsed.drawTime || '3:00 PM',
                firstPrizeAmountFormatted: firstPrize ? `₹${firstPrize.amount.toLocaleString('en-IN')}` : '₹1,00,00,000',
                firstPrizeTicket: firstWinner?.displayNumber,
                resultUrl: `${APP_URL}/result/${parsed.drawDateFormatted}/${slug}`,
              }),
            });
          } catch (notifyErr) {
            console.warn('Failed to dispatch FCM push notification webhook:', notifyErr);
          }
        }

      } catch (itemErr: any) {
        errors.push(`${item.title}: ${itemErr.message || itemErr}`);
      }
    }

    const completedAt = new Date();
    const finalStatus = errors.length > 0 && newResults === 0 && updatedResults === 0 ? 'FAILED' : 'SUCCESS';

    if (syncLogId) {
      await supabase.from('SyncLog').update({
        completedAt: completedAt.toISOString(),
        status: finalStatus,
        recordsFound,
        newDrawsCount: newResults,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
      }).eq('id', syncLogId);
    }

    return new Response(JSON.stringify({
      success: true,
      newResults,
      updatedResults,
      skippedResults,
      recordsFound,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (fatalErr: any) {
    if (syncLogId) {
      await supabase.from('SyncLog').update({
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        errorMessage: fatalErr.message || 'Fatal synchronization crash',
      }).eq('id', syncLogId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: fatalErr.message || 'Edge function failure',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
