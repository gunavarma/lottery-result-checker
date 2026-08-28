import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse, isValid } from 'date-fns';
import { Filter, Search, Calendar, ChevronLeft, ChevronRight, Award, FileText } from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Previous Kerala Lottery Results Archive | Search Past Draws',
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
      <Breadcrumbs items={[{ label: 'Previous Results' }]} />

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Official LOTIS Archives
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Previous Kerala Lottery Results
        </h1>
        <p className="text-sm text-slate-600">
          Filter and search verified past draw numbers, winning tickets, and prize tiers across all Kerala State Lottery schemes.
        </p>
      </div>

      {/* Multi-Filter Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form method="GET" action="/previous-results" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scheme Filter */}
            <div>
              <label htmlFor="lottery" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Lottery Scheme
              </label>
              <select
                id="lottery"
                name="lottery"
                defaultValue={data.filters.lottery}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 font-medium"
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
            <div>
              <label htmlFor="year" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Year
              </label>
              <select
                id="year"
                name="year"
                defaultValue={data.filters.year}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 font-medium"
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
            <div>
              <label htmlFor="month" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Month
              </label>
              <select
                id="month"
                name="month"
                defaultValue={data.filters.month}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 font-medium"
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
            <div>
              <label htmlFor="search" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Search Draw / Keyword
              </label>
              <input
                id="search"
                type="text"
                name="search"
                defaultValue={data.filters.search}
                placeholder="e.g. KN-638, SS-534"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 font-medium"
              >
              </input>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Found <strong>{data.pagination.total}</strong> draw results
            </span>
            <div className="flex gap-2">
              <Link
                href="/previous-results"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </span>
              )}

              <span className="text-xs font-medium text-slate-600 px-3">
                Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.totalPages}</strong>
              </span>

              {data.pagination.hasNextPage ? (
                <Link
                  href={`/previous-results?page=${data.pagination.page + 1}&lottery=${data.filters.lottery}&year=${data.filters.year}&month=${data.filters.month}&search=${encodeURIComponent(data.filters.search)}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 space-y-3">
          <p className="text-base font-semibold text-slate-700">No results found matching your criteria.</p>
          <p className="text-xs text-slate-500">Try changing or clearing your filter selection.</p>
          <Link
            href="/previous-results"
            className="inline-block mt-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Clear All Filters
          </Link>
        </div>
      )}
    </div>
  );
}
