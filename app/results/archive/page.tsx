import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse, isValid } from 'date-fns';
import { Filter, Search, Calendar, ChevronLeft, ChevronRight, Award, FileText, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Results Archive | Search Historical Draws',
  description:
    'Search and browse official previous Kerala lottery results archive by lottery scheme, year, month, draw number or date. Synchronized with official LOTIS records.',
  path: '/results/archive',
  keywords: [
    'Kerala Lottery Previous Results',
    'Kerala Lottery Result Archive',
    'Old Kerala Lottery Results',
    'Kerala Lottery Result History',
    'KeralaDraws',
  ],
});

async function getArchiveResultsData(searchParams: {
  lottery?: string;
  year?: string;
  month?: string;
  date?: string;
  search?: string;
  page?: string;
}) {
  const lotterySlug = searchParams.lottery;
  const year = searchParams.year;
  const month = searchParams.month;
  const date = searchParams.date;
  const search = searchParams.search?.trim();
  const page = Math.max(parseInt(searchParams.page || '1', 10), 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'PUBLISHED',
  };

  if (lotterySlug && lotterySlug !== 'all') {
    where.lottery = { slug: lotterySlug };
  }

  if (search) {
    where.OR = [
      { drawNumber: { contains: search.toUpperCase() } },
      { lottery: { name: { contains: search } } },
    ];
  }

  if (date) {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      const nextDay = new Date(parsedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.drawDate = {
        gte: parsedDate,
        lt: nextDay,
      };
    }
  } else if (year && month && month !== 'all') {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const targetDate = new Date(y, m, 1);
    where.drawDate = {
      gte: startOfMonth(targetDate),
      lte: endOfMonth(targetDate),
    };
  } else if (year && year !== 'all') {
    const targetDate = new Date(parseInt(year, 10), 0, 1);
    where.drawDate = {
      gte: startOfYear(targetDate),
      lte: endOfYear(targetDate),
    };
  }

  try {
    const [lotteries, total, draws] = await Promise.all([
      prisma.lottery.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.draw.count({ where }),
      prisma.draw.findMany({
        where,
        orderBy: { drawDate: 'desc' },
        skip,
        take: limit,
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            take: 3,
            include: {
              winningNumbers: { take: 3 },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return serializeData({
      lotteries,
      draws,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        lottery: lotterySlug || 'all',
        year: year || 'all',
        month: month || 'all',
        date: date || '',
        search: search || '',
      },
    });
  } catch (error) {
    console.error('Error in getArchiveResultsData:', error);
    return {
      lotteries: [],
      draws: [],
      pagination: {
        total: 0,
        page: 1,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        lottery: lotterySlug || 'all',
        year: year || 'all',
        month: month || 'all',
        date: date || '',
        search: search || '',
      },
    };
  }
}

export default async function ResultsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{
    lottery?: string;
    year?: string;
    month?: string;
    date?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getArchiveResultsData(params);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' },
    { name: 'Archive', url: '/results/archive' },
  ];

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Results', href: '/results' },
          { label: 'Results Archive' },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Historical Draw Gazette
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Results Archive
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Search and filter verified Kerala State Lottery draw records by scheme, year, month, or draw number.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs">
        <form method="GET" action="/results/archive" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filter by Scheme */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block font-tabular">
                Lottery Scheme
              </label>
              <select
                name="lottery"
                defaultValue={data.filters.lottery}
                className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
              >
                <option value="all">All Lotteries (Weekly & Bumpers)</option>
                {data.lotteries.map((l: any) => (
                  <option key={l.id} value={l.slug}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block font-tabular">
                Year
              </label>
              <select
                name="year"
                defaultValue={data.filters.year}
                className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Month */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block font-tabular">
                Month
              </label>
              <select
                name="month"
                defaultValue={data.filters.month}
                className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
              >
                <option value="all">All Months</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search input for Draw Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block font-tabular">
                Search Draw Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="e.g. KN-638, SK-67"
                  defaultValue={data.filters.search}
                  className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32] uppercase"
                />
                <Search className="w-4 h-4 text-[#68736E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E2E7E3]">
            <span className="text-xs text-[#68736E] font-medium">
              Found <strong className="text-[#17201D] font-tabular">{data.pagination.total}</strong> certified records
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/results/archive"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#68736E] hover:text-[#17201D] transition-colors"
              >
                Reset Filters
              </Link>
              <button
                type="submit"
                className="bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Filter Archive
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Listing */}
      {data.draws.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#68736E] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#17201D]">No Results Found</h3>
            <p className="text-xs text-[#68736E] max-w-sm mx-auto">
              No historical draw records match your current filter parameters. Try adjusting the scheme, month, or search keywords.
            </p>
          </div>
          <Link
            href="/results/archive"
            className="inline-block bg-[#0B3B32] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.draws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {data.pagination.hasPrevPage && (
                <Link
                  href={{
                    pathname: '/results/archive',
                    query: { ...params, page: String(data.pagination.page - 1) },
                  }}
                  className="p-2.5 rounded-xl border border-[#E2E7E3] bg-white text-[#17201D] hover:bg-[#F7F7F4] transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}

              <span className="text-xs text-[#68736E] px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] font-tabular">
                Page <strong className="text-[#17201D]">{data.pagination.page}</strong> of{' '}
                <strong className="text-[#17201D]">{data.pagination.totalPages}</strong>
              </span>

              {data.pagination.hasNextPage && (
                <Link
                  href={{
                    pathname: '/results/archive',
                    query: { ...params, page: String(data.pagination.page + 1) },
                  }}
                  className="p-2.5 rounded-xl border border-[#E2E7E3] bg-white text-[#17201D] hover:bg-[#F7F7F4] transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
