import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { ResultRow } from '@/components/ResultRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        take: 20,
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
        orderBy: { name: 'asc' },
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
      dayName: i === 0 ? 'TODAY' : format(d, 'EEE').toUpperCase(),
      month: format(d, 'MMM').toUpperCase(),
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 font-tabular">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'KERALA LOTTERY RESULTS' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#E1E6E1] pb-4 space-y-1">
        <span className="text-[11px] font-extrabold text-[#0A3828] uppercase tracking-widest block">
          OFFICIAL GAZETTE RECORDS
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#141716] tracking-tight uppercase">
          KERALA LOTTERY RESULTS
        </h1>
        <p className="text-xs text-[#646E68]">
          Certified Kerala State Lottery results published daily following live certification at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {/* 1. DATE NAVIGATOR */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#646E68] block">
          DATE NAVIGATOR
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {dateNavItems.map((item) => (
            <Link
              key={item.dateStr}
              href={`/results/date/${item.dateStr}`}
              className="flex-1 min-w-[72px] p-2 bg-white hover:bg-[#0A3828] hover:text-white text-[#141716] border border-[#E1E6E1] text-center transition-colors group cursor-pointer"
            >
              <span className="text-[9px] font-bold text-[#646E68] group-hover:text-[#C59B27] block">
                {item.dayName}
              </span>
              <span className="text-base font-black block leading-tight">
                {item.dayNum} {item.month}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. LOTTERY FILTER PILLS */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#646E68] block">
          LOTTERY SCHEMES
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/results"
            className="px-3 py-1 bg-[#0A3828] text-white text-xs font-black uppercase tracking-wider border border-[#0A3828]"
          >
            ALL
          </Link>
          {lotteries.map((l: any) => (
            <Link
              key={l.id}
              href={`/lotteries/${l.slug}`}
              className="px-3 py-1 bg-white hover:bg-[#F4F3EE] text-[#141716] text-xs font-bold uppercase tracking-wider border border-[#E1E6E1] transition-colors"
            >
              {l.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. RESULT STREAM */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E1E6E1] pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0A3828]">
            LATEST CERTIFIED RESULTS STREAM
          </span>
          <span className="text-xs text-[#646E68]">
            Showing {latestDraws.length} Official Records
          </span>
        </div>

        <div className="bg-white border border-[#E1E6E1] divide-y divide-[#E1E6E1]">
          {latestDraws.map((draw: any) => (
            <ResultRow key={draw.id} draw={draw} />
          ))}
        </div>
      </div>
    </div>
  );
}
