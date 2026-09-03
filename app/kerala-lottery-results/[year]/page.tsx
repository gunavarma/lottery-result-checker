import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema, SITE_URL } from '@/lib/seo';
import { formatDateOnly, formatIstDate } from '@/lib/date';
import { getOrSetCache } from '@/lib/cache';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ year: string }>;
}

async function getYearArchiveData(yearStr: string) {
  if (!/^\d{4}$/.test(yearStr)) return null;

  const yearNum = parseInt(yearStr, 10);
  const cacheKey = `archive_year_page_${yearStr}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const startOfYear = new Date(Date.UTC(yearNum, 0, 1));
      const endOfYear = new Date(Date.UTC(yearNum, 11, 31));

      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            gte: startOfYear,
            lte: endOfYear,
          },
          status: 'PUBLISHED',
        },
        orderBy: { drawDate: 'desc' },
        include: {
          lottery: true,
          prizes: {
            where: { orderIndex: 0 },
            include: {
              winningNumbers: { take: 1 },
            },
          },
        },
      });

      if (!draws || draws.length === 0) return null;

      // Group by month
      const monthMap = new Map<string, { month: string; monthName: string; count: number }>();
      for (const d of draws) {
        const dateStr = formatDateOnly(d.drawDate);
        const [, m] = dateStr.split('-');
        const existing = monthMap.get(m);
        if (existing) {
          existing.count++;
        } else {
          const dateObj = new Date(Date.UTC(yearNum, Number(m) - 1, 15));
          const monthName = dateObj.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
          monthMap.set(m, { month: m, monthName, count: 1 });
        }
      }

      return serializeData({
        yearStr,
        draws,
        totalCount: draws.length,
        months: Array.from(monthMap.values()),
      });
    },
    { ttlMs: 300_000, swrMs: 86400_000 }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year: yearStr } = await params;
  const data = await getYearArchiveData(yearStr);

  if (!data) {
    return constructMetadata({
      title: 'Kerala Lottery Archive Not Found',
      path: `/kerala-lottery-results/${yearStr}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `Kerala Lottery Results ${yearStr} – Full Year Archive | KeralaDraws`,
    description: `Complete archive of all official Kerala State Lottery results for ${yearStr}. Inspect certified winning ticket numbers, 1st prize winners, and LOTIS gazette publications.`,
    path: `/kerala-lottery-results/${yearStr}`,
    keywords: [
      `Kerala lottery results ${yearStr}`,
      `Kerala lottery ${yearStr} winning numbers`,
      `Kerala lottery ${yearStr} list`,
      'KeralaDraws archive',
    ],
  });
}

export default async function YearArchivePage({ params }: PageProps) {
  const { year: yearStr } = await params;
  const data = await getYearArchiveData(yearStr);

  if (!data) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Kerala Lottery Results', url: `${SITE_URL}/kerala-lottery-results` },
    { name: yearStr, url: `${SITE_URL}/kerala-lottery-results/${yearStr}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results', href: '/kerala-lottery-results' },
          { label: yearStr },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular">
          Annual Gazette Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Results {yearStr} – Complete Archive
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          All {data.totalCount} official Kerala State Lottery draws published in the year {yearStr}. Select a month below to view verified winning ticket numbers and gazette documents.
        </p>
      </div>

      {/* Month Navigation Pills */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#17201D]">
          <CalendarIcon className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-base font-extrabold">
            {yearStr} Monthly Breakdown
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {data.months.map((m: any) => (
            <Link
              key={m.month}
              href={`/kerala-lottery-results/${yearStr}/${m.month}`}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3] transition-colors inline-flex items-center gap-2"
            >
              <span>{m.monthName} {yearStr}</span>
              <span className="text-[10px] text-[#0B3B32] bg-[#E2E7E3] px-2 py-0.5 rounded-md font-mono font-bold">
                {m.count} draws
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Draws Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#68736E]">
            All {data.totalCount} official draws in {yearStr}
          </span>
          <Link
            href="/ticket-checker"
            className="text-xs font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Check ticket against {yearStr} draws</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.draws.map((draw: any) => {
            const dateSlug = formatDateOnly(draw.drawDate);
            const dateDisplay = formatIstDate(new Date(draw.drawDate), 'dd MMM yyyy');
            const firstPrize = draw.prizes?.[0];
            const firstWinner = firstPrize?.winningNumbers?.[0];

            return (
              <article
                key={draw.id}
                className="bg-white rounded-3xl p-5 border border-[#E2E7E3] shadow-xs hover:border-[#0B3B32]/40 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]">
                      {draw.lottery.code}
                    </span>
                    <span className="text-xs font-bold text-[#68736E] font-tabular">
                      {dateDisplay}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#17201D]">
                      {draw.lottery.name}
                    </h3>
                    <span className="text-xs text-[#68736E]">
                      Draw No. {draw.drawNumber}
                    </span>
                  </div>

                  {firstWinner && (
                    <div className="bg-[#F7F7F4] p-3 rounded-2xl border border-[#E2E7E3] text-center">
                      <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">
                        1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                      </span>
                      <span className="text-xl font-black font-mono text-[#16845B] block mt-0.5">
                        {firstWinner.displayNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E2E7E3] flex items-center justify-between">
                  <Link
                    href={`/lottery/${draw.lottery.slug}`}
                    className="text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32]"
                  >
                    {draw.lottery.name} Hub
                  </Link>
                  <Link
                    href={`/kerala-lottery-result/${dateSlug}`}
                    className="inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>View Result</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
