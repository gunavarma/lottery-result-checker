import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { ResultCard } from '@/components/ResultCard';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { getOrSetCache } from '@/lib/cache';
import {
  isValidDateFormat,
  parseDateOnlyUtc,
  getIstDateRange,
  getAdjacentAvailableDates,
} from '@/lib/date';
import {
  format,
  parseISO,
  addDays,
  startOfDay,
  endOfDay,
  isValid,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Award,
  Ticket,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const parsed = parseISO(date);

  if (!isValid(parsed)) {
    return constructMetadata({
      title: 'Invalid Date | KeralaDraws',
      path: `/results/date/${date}`,
      noIndex: true,
    });
  }

  const formatted = format(parsed, 'dd MMMM yyyy (EEEE)');

  return constructMetadata({
    title: `Kerala Lottery Results on ${formatted} | Winning Numbers`,
    description: `Official Kerala lottery results held on ${formatted}. Complete winning ticket numbers, 1st prize results, prize breakdown and LOTIS gazette verification on KeralaDraws.`,
    path: `/results/date/${date}`,
    keywords: [
      `Kerala Lottery Result ${format(parsed, 'dd MMMM yyyy')}`,
      `Kerala Lottery Results on ${format(parsed, 'yyyy-MM-dd')}`,
      'Kerala Lottery Results History',
      'KeralaDraws',
    ],
  });
}

async function getDateResultsData(dateStr: string) {
  if (!isValidDateFormat(dateStr)) return null;

  const cacheKey = `page_results_date_${dateStr}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const targetDate = parseDateOnlyUtc(dateStr);
      const { formattedDisplay } = getIstDateRange(dateStr);
      const adjacent = await getAdjacentAvailableDates(dateStr);

      const draws = await prisma.draw.findMany({
        where: {
          drawDate: targetDate,
          status: 'PUBLISHED',
        },
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            include: {
              winningNumbers: {
                orderBy: { id: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return serializeData({
        dateStr,
        dateFormatted: formattedDisplay,
        prevDateStr: adjacent.prevAvailableDate || format(addDays(targetDate, -1), 'yyyy-MM-dd'),
        nextDateStr: adjacent.nextAvailableDate || format(addDays(targetDate, 1), 'yyyy-MM-dd'),
        isFuture: targetDate.getTime() > Date.now(),
        draws,
      });
    },
    { ttlMs: 300_000, swrMs: 86400_000 }
  );
}

export default async function DateResultsPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const data = await getDateResultsData(date);

  if (!data) {
    notFound();
  }

  const { dateFormatted, prevDateStr, nextDateStr, isFuture, draws } = data;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Results Hub', url: '/results' },
    { name: 'Results by Date', url: `/results/date/${date}` },
    { name: dateFormatted, url: `/results/date/${date}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Results', href: '/results' },
          { label: dateFormatted },
        ]}
      />

      {/* Date Header & Navigation Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Certified Daily Gazettes
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17201D] tracking-tight">
              Kerala Lottery Results: {dateFormatted}
            </h1>
            <p className="text-xs sm:text-sm text-[#68736E] mt-1">
              Official draw proceedings conducted at Gorky Bhavan, Thiruvananthapuram.
            </p>
          </div>

          {/* Quick Date Navigation */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/results/date/${prevDateStr}`}
              className="inline-flex items-center gap-1 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-3.5 py-2 rounded-xl font-bold text-xs transition-colors font-tabular"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Date</span>
            </Link>

            <Link
              href={`/results/date/${nextDateStr}`}
              className="inline-flex items-center gap-1 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-3.5 py-2 rounded-xl font-bold text-xs transition-colors font-tabular"
            >
              <span>Next Date</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Date Selector Jump */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#68736E]">
            <CalendarIcon className="w-4 h-4 text-[#0B3B32]" />
            <span>Select any date to inspect historical results:</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/results"
              className="font-bold text-[#0B3B32] hover:underline flex items-center gap-1"
            >
              <span>Browse All Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Draws List for this Date */}
      {draws.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#68736E] flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#17201D]">
              {isFuture
                ? 'Draw Scheduled for this Date'
                : 'No Kerala Lottery Draw Recorded on this Date'}
            </h2>
            <p className="text-xs text-[#68736E] max-w-md mx-auto">
              {isFuture
                ? `The draw for ${dateFormatted} will take place at 3:00 PM IST. Certified results will be published immediately following conclusion.`
                : `No official lottery draw occurred or was published on ${dateFormatted}. Kerala State Lotteries are conducted according to the weekly timetable.`}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/kerala-lottery-result-today"
              className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              <span>Today's Result</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/lottery-calendar"
              className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
            >
              <span>View Draw Timetable</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {draws.map((draw: any) => {
            const firstPrize = draw.prizes?.find(
              (p: any) => p.tierNumber === 1 || p.orderIndex === 0
            );
            const firstWinner = firstPrize?.winningNumbers?.[0];

            return (
              <div
                key={draw.id}
                className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]">
                        {draw.lottery.code}
                      </span>
                      <span className="font-bold text-xs bg-[#0B3B32] text-white px-3 py-0.5 rounded-md">
                        CERTIFIED RESULT
                      </span>
                      <OfficialSourceBadge
                        sourceUrl={draw.sourceDocumentUrl}
                        drawNumber={draw.drawNumber}
                        drawDate={dateFormatted}
                      />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D]">
                      {draw.lottery.name} ({draw.drawNumber})
                    </h2>
                  </div>

                  {firstWinner && (
                    <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#E2E7E3] text-center shrink-0 min-w-[200px]">
                      <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                        1st Prize ({formatINR(firstPrize.amount)})
                      </span>
                      <span className="text-2xl font-black font-mono text-[#16845B] block mt-1">
                        {firstWinner.displayNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Full Prize Table */}
                <div className="space-y-3">
                  <PrizeTable
                    lotteryName={draw.lottery.name}
                    drawNumber={draw.drawNumber}
                    prizes={draw.prizes}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E7E3]">
                  <Link
                    href={`/results/${draw.lottery.slug}/${draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Permanent Draw Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <ResultShareBar
                    title={`${draw.lottery.name} (${draw.drawNumber}) on ${dateFormatted}`}
                    url={`/results/date/${date}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
