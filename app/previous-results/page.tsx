import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse, isValid } from 'date-fns';
import { Filter, Search, Calendar, ChevronLeft, ChevronRight, Award, FileText, ArrowRight } from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Kerala Lottery Results Archive | Search Historical Draws',
  description:
    'Search and browse official previous Kerala lottery results archive by lottery scheme, year, month, draw number or date. Synchronized with official LOTIS records.',
};

async function getPreviousResultsData(searchParams: {
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

  const totalPages = Math.ceil(total / limit);

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
}

export default async function PreviousResultsPage({
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
  const data = await getPreviousResultsData(params);

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
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Results Archive' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Official LOTIS Archives
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Results Archive
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Filter and search verified past draw numbers, winning tickets, and prize tiers across all Kerala State Lottery schemes.
        </p>
      </div>

      {/* Multi-Filter Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm">
        <form method="GET" action="/previous-results" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scheme Filter */}
            <div className="space-y-1.5">
              <label htmlFor="lottery" className="block text-xs font-bold text-[#17201D] uppercase">
                Lottery Scheme
              </label>
              <select
                id="lottery"
                name="lottery"
                defaultValue={data.filters.lottery}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-xs font-bold text-[#17201D]"
              >
                <option value="all">All Lottery Schemes</option>
                {data.lotteries?.map((lot: any) => (
                  <option key={lot.slug} value={lot.slug}>
                    {lot.name} ({lot.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1.5">
              <label htmlFor="year" className="block text-xs font-bold text-[#17201D] uppercase">
                Year
              </label>
              <select
                id="year"
                name="year"
                defaultValue={data.filters.year}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-xs font-bold text-[#17201D]"
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="space-y-1.5">
              <label htmlFor="month" className="block text-xs font-bold text-[#17201D] uppercase">
                Month
              </label>
              <select
                id="month"
                name="month"
                defaultValue={data.filters.month}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-xs font-bold text-[#17201D]"
              >
                <option value="all">All Months</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label htmlFor="search" className="block text-xs font-bold text-[#17201D] uppercase">
                Draw Number / Keyword
              </label>
              <input
                id="search"
                type="text"
                name="search"
                defaultValue={data.filters.search}
                placeholder="e.g. KN-638, SK-67"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-xs font-bold text-[#17201D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E2E7E3] mt-2">
            <span className="text-xs text-[#68736E]">
              Found <strong className="text-[#17201D] font-tabular">{data.pagination.total}</strong> draw results
            </span>
            <div className="flex gap-2">
              <Link
                href="/previous-results"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#68736E] hover:bg-[#F7F7F4] transition-colors"
              >
                Reset Filters
              </Link>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors font-tabular"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Grid */}
      {data.draws && data.draws.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.draws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>

          {/* Pagination Controls */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              {data.pagination.hasPrevPage ? (
                <Link
                  href={`/previous-results?page=${data.pagination.page - 1}&lottery=${data.filters.lottery}&year=${data.filters.year}&month=${data.filters.month}&search=${encodeURIComponent(data.filters.search)}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] text-[#17201D] font-bold text-xs hover:bg-[#F7F7F4]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F7F4] text-[#68736E] font-bold text-xs cursor-not-allowed border border-[#E2E7E3]">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </span>
              )}

              <span className="text-xs font-medium text-[#68736E] px-3 font-tabular">
                Page <strong className="text-[#17201D]">{data.pagination.page}</strong> of <strong className="text-[#17201D]">{data.pagination.totalPages}</strong>
              </span>

              {data.pagination.hasNextPage ? (
                <Link
                  href={`/previous-results?page=${data.pagination.page + 1}&lottery=${data.filters.lottery}&year=${data.filters.year}&month=${data.filters.month}&search=${encodeURIComponent(data.filters.search)}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] text-[#17201D] font-bold text-xs hover:bg-[#F7F7F4]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F7F4] text-[#68736E] font-bold text-xs cursor-not-allowed border border-[#E2E7E3]">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-3">
          <p className="text-base font-bold text-[#17201D]">No results found matching your criteria.</p>
          <p className="text-xs text-[#68736E]">Try changing or resetting your filter selection.</p>
          <Link
            href="/previous-results"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#0B3B32] text-white font-bold text-xs"
          >
            Reset Filters
          </Link>
        </div>
      )}
    </div>
  );
}
