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
  params: Promise<{ year: string; month: string }>;
}

async function getMonthArchiveData(yearStr: string, monthStr: string) {
  if (!/^\d{4}$/.test(yearStr) || !/^\d{2}$/.test(monthStr)) return null;

  const yearNum = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  if (monthNum < 1 || monthNum > 12) return null;

  const cacheKey = `archive_month_page_${yearStr}_${monthStr}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      // Calculate start and end of month in UTC
      const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1));
      const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            gte: startOfMonth,
            lte: endOfMonth,
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

      const dateObj = new Date(Date.UTC(yearNum, monthNum - 1, 15));
      const monthName = dateObj.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

      return serializeData({
        yearStr,
        monthStr,
        monthName,
        draws,
        totalCount: draws.length,
      });
    },
    { ttlMs: 300_000, swrMs: 86400_000 }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year: yearStr, month: monthStr } = await params;
  const data = await getMonthArchiveData(yearStr, monthStr);

  if (!data) {
    return constructMetadata({
      title: 'Kerala Lottery Month Archive Not Found',
      path: `/kerala-lottery-results/${yearStr}/${monthStr}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `Kerala Lottery Results ${data.monthName} ${yearStr} – Winning Numbers | KeralaDraws`,
    description: `Official Kerala State Lottery results for ${data.monthName} ${yearStr}. Inspect certified winning ticket numbers, 1st prize winners, and LOTIS gazette publications for all ${data.totalCount} draws.`,
    path: `/kerala-lottery-results/${yearStr}/${monthStr}`,
    keywords: [
      `Kerala lottery results ${data.monthName} ${yearStr}`,
      `Kerala lottery ${data.monthName} ${yearStr} winning numbers`,
      `Kerala lottery ${data.monthName} ${yearStr} chart`,
      'KeralaDraws monthly archive',
    ],
  });
}

export default async function MonthArchivePage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params;
  const data = await getMonthArchiveData(yearStr, monthStr);

  // Strict anti-soft-404: If month has no verified draws, return authentic 404
  if (!data) {
    notFound();
  }

  const { monthName, draws, totalCount } = data;

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Kerala Lottery Results', url: `${SITE_URL}/kerala-lottery-results` },
    { name: yearStr, url: `${SITE_URL}/kerala-lottery-results/${yearStr}` },
    { name: monthName, url: `${SITE_URL}/kerala-lottery-results/${yearStr}/${monthStr}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results', href: '/kerala-lottery-results' },
          { label: yearStr, href: `/kerala-lottery-results/${yearStr}` },
          { label: monthName },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular">
            Monthly Gazette Archive
          </span>
          <span className="text-xs font-bold text-[#68736E] font-tabular">
            {monthName} {yearStr}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Results – {monthName} {yearStr}
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Complete verified list of all {totalCount} Kerala State Lottery draws conducted in {monthName} {yearStr}. Click any draw to view the full prize breakdown and certified winning tickets.
        </p>
      </div>

      {/* Quick Links Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] text-xs">
        <div className="flex items-center gap-2">
          <Link
            href={`/kerala-lottery-results/${yearStr}`}
            className="font-bold text-[#0B3B32] hover:underline"
          >
            ← View All {yearStr} Results
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ticket-checker"
            className="bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold transition-colors inline-flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Verify Ticket</span>
          </Link>
          <Link
            href="/kerala-lottery-results"
            className="bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] font-bold transition-colors"
          >
            All Archives
          </Link>
        </div>
      </div>

      {/* Draws Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#68736E]">
            {totalCount} certified draws held in {monthName} {yearStr}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {draws.map((draw: any) => {
            const dateSlug = formatDateOnly(draw.drawDate);
            const dateDisplay = formatIstDate(new Date(draw.drawDate), 'dd MMMM yyyy (EEEE)');
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
                    <span className="text-xs font-bold text-[#17201D] font-tabular">
                      {dateSlug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#17201D]">
                      {draw.lottery.name}
                    </h3>
                    <span className="text-xs text-[#68736E]">
                      Draw No. {draw.drawNumber} | {dateDisplay}
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
                      {firstWinner.location && (
                        <span className="text-[11px] text-[#68736E] block mt-0.5">
                          Sold in {firstWinner.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E2E7E3] flex items-center justify-between">
                  <Link
                    href={`/lottery/${draw.lottery.slug}`}
                    className="text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32]"
                  >
                    {draw.lottery.name}
                  </Link>
                  <Link
                    href={`/kerala-lottery-result/${dateSlug}`}
                    className="inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>View Gazette Result</span>
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
