import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import {
  Calendar,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Ticket,
  Search,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Results | Latest Official Draw Records',
  description:
    'Browse all latest official Kerala State Lottery results, certified winning numbers, daily 3:00 PM draw announcements, and LOTIS gazette releases.',
  path: '/results',
  keywords: [
    'Kerala Lottery Results',
    'Kerala Lottery Result Today',
    'Kerala State Lottery Winning Numbers',
    'Latest Kerala Lottery Results',
    'Kerala Lottery Result 2026',
    'KeralaDraws',
  ],
});

async function getResultsHubData() {
  try {
    const [latestDraws, lotteries] = await Promise.all([
      prisma.draw.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 25,
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            take: 3,
            include: {
              winningNumbers: { take: 2 },
            },
          },
        },
      }),
      prisma.lottery.findMany({
        where: { active: true },
        orderBy: [
          { isBumper: 'asc' },
          { name: 'asc' },
        ],
      }),
    ]);

    return {
      latestDraws: serializeData(latestDraws),
      lotteries: serializeData(lotteries),
    };
  } catch (error) {
    console.error('Error in getResultsHubData:', error);
    return {
      latestDraws: [],
      lotteries: [],
    };
  }
}

export default async function ResultsHubPage() {
  const { latestDraws, lotteries } = await getResultsHubData();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' },
  ];

  // Generate date navigator buttons for recent 7 days
  const today = new Date();
  const dateNavItems = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, i);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      dayNum: format(d, 'dd'),
      dayName: i === 0 ? 'Today' : format(d, 'EEE'),
      month: format(d, 'MMM'),
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results' },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Results
        </h1>

      </div>

      {/* 1. Quick Date Navigator Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E7E3] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0B3B32]" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#17201D]">
              Quick Date Navigator (Last 7 Days)
            </h2>
          </div>
          <Link
            href="/calendar"
            className="text-xs font-bold text-[#0B3B32] hover:underline flex items-center gap-1"
          >
            <span>View Full Calendar Timetable</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {dateNavItems.map((item) => (
            <Link
              key={item.dateStr}
              href={`/results/date/${item.dateStr}`}
              className="p-3 bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white border border-[#E2E7E3] hover:border-[#0B3B32] rounded-2xl text-center transition-all group cursor-pointer shadow-2xs"
            >
              <span className="text-[10px] font-bold text-[#68736E] group-hover:text-[#C69A3A] uppercase tracking-wider block font-tabular">
                {item.dayName}
              </span>
              <span className="text-base sm:text-lg font-black text-[#17201D] group-hover:text-white block font-tabular mt-0.5">
                {item.dayNum} {item.month}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Scheme Filter Pills */}
      <div className="space-y-3">
        <div>
          <span className="text-xs font-bold text-[#17201D] uppercase tracking-wide">
            Filter by Lottery Scheme
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/results"
            className="px-4 py-2 rounded-xl bg-[#0B3B32] text-white text-xs font-bold transition-all shadow-xs"
          >
            All Active Schemes
          </Link>
          {lotteries.map((l: any) => (
            <Link
              key={l.id}
              href={`/lotteries/${l.slug}`}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] hover:border-[#0B3B32]/30 text-xs font-bold transition-colors shadow-2xs"
            >
              {l.name}
              {l.isBumper && <span className="ml-1 text-[10px] text-[#A66A00]">★</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Chronological Results Stream Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E7E3] pb-4">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Published Gazette Stream
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Latest Certified Results
            </h2>
          </div>
          <span className="text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-full font-tabular border border-[#0B3B32]/10 self-start sm:self-auto">
            Showing {latestDraws.length} Certified Records
          </span>
        </div>

        {latestDraws.length === 0 ? (
          <div className="bg-[#F7F7F4] rounded-2xl p-10 text-center text-[#68736E] text-xs border border-[#E2E7E3] space-y-2">
            <p className="font-bold text-[#17201D]">No lottery results found.</p>
            <p>Certified results are synchronizing with the official LOTIS database.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E7E3] -mx-6 sm:-mx-8 lg:-mx-10">
            {latestDraws.map((draw: any) => {
              const drawDate = draw.drawDate ? new Date(draw.drawDate) : new Date();
              const dayStr = format(drawDate, 'dd');
              const monthStr = format(drawDate, 'MMM');
              const dayName = format(drawDate, 'EEE');

              const firstPrize = draw.prizes?.find(
                (p: any) => p.tierNumber === 1 || p.orderIndex === 0
              );
              const firstWinner = firstPrize?.winningNumbers?.[0];
              const topPrizeAmount = firstPrize?.amount ? formatINR(firstPrize.amount) : '₹1 Crore';

              const lotterySlug = draw.lottery?.slug || 'kerala-lottery';
              const drawNumberSlug = draw.drawNumber
                ? draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                : '';
              const resultUrl = `/results/${lotterySlug}/${drawNumberSlug}`;

              return (
                <div
                  key={draw.id}
                  className="px-6 sm:px-8 lg:px-10 py-5 hover:bg-[#FAFAF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Date Capsule + Lottery Scheme Info */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Date Capsule */}
                    <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl px-3.5 py-2 text-center shrink-0 min-w-[72px]">
                      <span className="text-[10px] font-bold uppercase text-[#68736E] block font-tabular">
                        {dayName}
                      </span>
                      <span className="text-sm font-black text-[#17201D] font-tabular block mt-0.5">
                        {dayStr} {monthStr}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded-lg border border-[#E2E7E3]">
                          {draw.drawNumber}
                        </span>
                        <span className="text-[11px] text-[#68736E] font-medium">
                          {draw.lottery?.drawDay || 'Weekly Draw'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5">
                        <Link href={resultUrl}>
                          {draw.lottery?.name} ({draw.drawNumber})
                        </Link>
                      </h3>
                    </div>
                  </div>

                  {/* Middle: 1st Prize Winner Display */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E7E3]/60">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[#68736E] uppercase font-bold tracking-wide block font-tabular">
                        1st Prize ({topPrizeAmount})
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono tracking-wider text-[#16845B] font-tabular block mt-0.5">
                        {firstWinner ? firstWinner.displayNumber : 'Certified'}
                      </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={resultUrl}
                        aria-label={`View full ${draw.lottery?.name} ${draw.drawNumber} results`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
                      >
                        <span>Full Result</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info note */}
        <div className="pt-4 border-t border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#68736E]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16845B]" />
            <span>All results verified against Kerala Government LOTIS Directorate gazettes.</span>
          </div>

          <Link
            href="/check-ticket"
            className="font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Check your physical ticket</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
