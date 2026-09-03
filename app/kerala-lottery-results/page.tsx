import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { constructMetadata, getBreadcrumbSchema, SITE_URL } from '@/lib/seo';
import { formatDateOnly, formatIstDate } from '@/lib/date';
import { getOrSetCache } from '@/lib/cache';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Filter,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    lottery?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: 'Kerala Lottery Results Archive – Previous Winning Numbers (2026) | KeralaDraws',
    description:
      'Complete, crawlable historical archive of official Kerala State Lottery results. Search all certified draws by date, month, year, and lottery scheme with official LOTIS gazette verification.',
    path: '/kerala-lottery-results',
    keywords: [
      'Kerala lottery results archive',
      'Kerala lottery old results',
      'Kerala lottery previous result 2026',
      'Kerala lottery history',
      'Kerala lottery results by date',
      'KeralaDraws archive',
    ],
  });
}

async function getArchiveData(lotterySlug?: string, pageNumber: number = 1) {
  const pageSize = 30;
  const skip = (pageNumber - 1) * pageSize;
  const cacheKey = `archive_main_page_v2_${lotterySlug || 'all'}_p${pageNumber}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const whereClause: any = { status: 'PUBLISHED' };

      if (lotterySlug && lotterySlug !== 'all') {
        const lottery = await prisma.lottery.findFirst({
          where: {
            OR: [{ slug: lotterySlug }, { code: lotterySlug.toUpperCase() }],
          },
        });
        if (lottery) {
          whereClause.lotteryId = lottery.id;
        }
      }

      const [totalCount, draws, lotteries, allDrawDates] = await Promise.all([
        prisma.draw.count({ where: whereClause }),
        prisma.draw.findMany({
          where: whereClause,
          orderBy: { drawDate: 'desc' },
          skip,
          take: pageSize,
          include: {
            lottery: true,
            prizes: {
              where: { orderIndex: 0 },
              include: {
                winningNumbers: { take: 1 },
              },
            },
          },
        }),
        prisma.lottery.findMany({
          where: { active: true },
          select: { id: true, name: true, slug: true, code: true },
          orderBy: { name: 'asc' },
        }),
        prisma.draw.findMany({
          where: { status: 'PUBLISHED' },
          select: { drawDate: true },
          orderBy: { drawDate: 'desc' },
        }),
      ]);

      // Calculate distinct years and months with verified data
      const monthMap = new Map<string, { year: string; month: string; label: string; count: number }>();
      for (const d of allDrawDates) {
        const dateStr = formatDateOnly(d.drawDate);
        const [y, m] = dateStr.split('-');
        const key = `${y}-${m}`;
        const existing = monthMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          const dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, 15));
          const monthName = dateObj.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
          monthMap.set(key, {
            year: y,
            month: m,
            label: `${monthName} ${y}`,
            count: 1,
          });
        }
      }

      return serializeData({
        totalCount,
        page: pageNumber,
        totalPages: Math.ceil(totalCount / pageSize),
        draws,
        lotteries,
        activeMonths: Array.from(monthMap.values()),
      });
    },
    { ttlMs: 60_000, swrMs: 600_000 }
  );
}

export default async function KeralaLotteryResultsArchivePage({ searchParams }: PageProps) {
  const { lottery: lotterySlug, page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const data = await getArchiveData(lotterySlug, currentPage);

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Kerala Lottery Results', url: `${SITE_URL}/kerala-lottery-results` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results Archive' },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular">
          Complete Official Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Results Historical Archive (2026)
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Browse verified Kerala State Lottery draw results from certified LOTIS gazettes. Explore results by year, month, or specific lottery scheme.
        </p>
      </div>

      {/* Month & Year Navigation Bar */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#17201D]">
          <CalendarIcon className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-base font-extrabold">
            Browse by Month & Year
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/kerala-lottery-results/2026"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B3B32] text-white hover:bg-[#16845B] transition-colors"
          >
            Full Year 2026
          </Link>
          {data.activeMonths.map((m: any) => (
            <Link
              key={`${m.year}-${m.month}`}
              href={`/kerala-lottery-results/${m.year}/${m.month}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3] transition-colors inline-flex items-center gap-1.5"
            >
              <span>{m.label}</span>
              <span className="text-[10px] text-[#0B3B32] bg-[#E2E7E3] px-1.5 py-0.2 rounded-md font-mono">
                {m.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Scheme Quick Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#68736E] mr-1">Scheme:</span>
        <Link
          href="/kerala-lottery-results"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            !lotterySlug || lotterySlug === 'all'
              ? 'bg-[#0B3B32] text-white'
              : 'bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]'
          }`}
        >
          All Schemes
        </Link>
        {data.lotteries.map((l: any) => (
          <Link
            key={l.id}
            href={`/kerala-lottery-results?lottery=${l.slug}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              lotterySlug === l.slug
                ? 'bg-[#0B3B32] text-white'
                : 'bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]'
            }`}
          >
            {l.name}
          </Link>
        ))}
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#68736E]">
            Showing {data.draws.length} of {data.totalCount} certified draws
          </span>
          <Link
            href="/ticket-checker"
            className="text-xs font-bold text-[#0B3B32] hover:underline inline-flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Verify physical ticket</span>
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

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/kerala-lottery-results?${lotterySlug ? `lottery=${lotterySlug}&` : ''}page=${p}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                currentPage === p
                  ? 'bg-[#0B3B32] text-white'
                  : 'bg-white hover:bg-[#E2E7E3] text-[#17201D] border border-[#E2E7E3]'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {/* Verification Trust Card */}
      <div className="bg-[#F7F7F4] rounded-3xl p-6 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16845B] shrink-0" />
          <span>
            All draw records in this archive are verified against official Kerala Government LOTIS gazette publications.
          </span>
        </div>
        <Link
          href="/ticket-checker"
          className="font-bold text-[#0B3B32] hover:underline shrink-0"
        >
          Check physical ticket →
        </Link>
      </div>
    </div>
  );
}
