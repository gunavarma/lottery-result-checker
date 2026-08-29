import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Award, Calendar, Search, ArrowRight, ShieldCheck, Ticket, Filter, Clock } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Results | Latest & Historical Draw Archive',
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
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [todayDraw, latestDraws, lotteries] = await Promise.all([
      prisma.draw.findFirst({
        where: {
          drawDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            include: {
              winningNumbers: true,
            },
          },
        },
      }),
      prisma.draw.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { drawDate: 'desc' },
        take: 12,
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            take: 2,
            include: {
              winningNumbers: { take: 1 },
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
      todayDraw: todayDraw ? serializeData(todayDraw) : null,
      latestDraws: serializeData(latestDraws),
      lotteries: serializeData(lotteries),
    };
  } catch (error) {
    console.error('Error in getResultsHubData:', error);
    return {
      todayDraw: null,
      latestDraws: [],
      lotteries: [],
    };
  }
}

export default async function ResultsHubPage() {
  const { todayDraw, latestDraws, lotteries } = await getResultsHubData();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Certified Draw Records
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Results Hub
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Official Kerala State Lottery results published daily following live certification at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {/* Today's Draw Quick Feature */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B3B32] text-[#C8A45D] px-2.5 py-0.5 rounded-full font-tabular">
              Today's Live Hub
            </span>
            <span className="text-xs text-[#68736E] font-medium font-tabular">
              {format(new Date(), 'dd MMMM yyyy (EEEE)')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
            {todayDraw ? `${todayDraw.lottery.name} (${todayDraw.drawNumber})` : "Today's Official Kerala Lottery Result"}
          </h2>
          <p className="text-xs text-[#68736E] max-w-2xl">
            {todayDraw
              ? `Draw certified and published. First prize winner: ${todayDraw.prizes?.[0]?.winningNumbers?.[0]?.displayNumber || 'Published'}.`
              : 'Draws take place daily at 3:00 PM IST. Certified gazette published around 4:30 PM.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/kerala-lottery-result-today"
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-3 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <span>View Today's Result</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/results/archive"
            className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-3 rounded-xl font-bold text-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Historical Archive</span>
          </Link>
        </div>
      </div>

      {/* Quick Lottery Schemes Filter Bar */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-[#68736E] uppercase tracking-wider font-tabular block">
          Browse By Scheme:
        </span>
        <div className="flex flex-wrap gap-2">
          {lotteries.map((l: any) => (
            <Link
              key={l.id}
              href={`/lotteries/${l.slug}`}
              className="text-xs font-bold bg-white hover:bg-[#F1F4F2] hover:text-[#0B3B32] text-[#17201D] border border-[#E2E7E3] px-3.5 py-1.5 rounded-xl transition-colors font-tabular"
            >
              {l.name}
            </Link>
          ))}
          <Link
            href="/results/archive"
            className="text-xs font-bold bg-[#0B3B32] text-white px-3.5 py-1.5 rounded-xl transition-colors"
          >
            All Archives →
          </Link>
        </div>
      </div>

      {/* Latest Certified Results Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
              Recent Certified Lottery Results
            </h2>
            <p className="text-xs text-[#68736E] mt-0.5">
              Verified records synchronized with official LOTIS PDF documents.
            </p>
          </div>
          <Link
            href="/results/archive"
            className="text-xs font-bold text-[#0B3B32] hover:text-[#17201D] flex items-center gap-1"
          >
            <span>Browse Full Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {latestDraws.map((draw: any) => (
            <ResultCard key={draw.id} draw={draw} />
          ))}
        </div>
      </div>
    </div>
  );
}
