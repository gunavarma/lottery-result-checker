import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultCard } from '@/components/ResultCard';
import { parse, isValid, format } from 'date-fns';
import { Search, Award, Calendar, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Kerala Lottery Results | Find Draws & Winning Tickets',
  description:
    'Search Kerala lottery results by lottery scheme, draw number (e.g. KN-638, SK-67), date or winning ticket number. Database search across verified official LOTIS results.',
};

async function getSearchResults(query: string) {
  if (!query || query.trim().length < 2) {
    return { draws: [], lotteries: [], winningTickets: [] };
  }

  const clean = query.trim();

  // 1. Search schemes
  const lotteries = await prisma.lottery.findMany({
    where: {
      OR: [
        { name: { contains: clean } },
        { code: { contains: clean.toUpperCase() } },
        { slug: { contains: clean.toLowerCase() } },
      ],
    },
    take: 6,
  });

  // 2. Search draws by draw number or date
  let dateFilter: any = null;
  let parsedDate = parse(clean, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedDate)) parsedDate = parse(clean, 'dd-MM-yyyy', new Date());
  if (!isValid(parsedDate)) parsedDate = parse(clean, 'dd/MM/yyyy', new Date());

  if (isValid(parsedDate)) {
    const nextDay = new Date(parsedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    dateFilter = {
      gte: parsedDate,
      lt: nextDay,
    };
  }

  const draws = await prisma.draw.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { drawNumber: { contains: clean.toUpperCase() } },
        dateFilter ? { drawDate: dateFilter } : {},
        { lottery: { name: { contains: clean } } },
      ].filter((o) => Object.keys(o).length > 0),
    },
    take: 12,
    orderBy: { drawDate: 'desc' },
    include: {
      lottery: true,
      prizes: {
        where: { orderIndex: 0 },
        include: { winningNumbers: { take: 1 } },
      },
    },
  });

  // 3. Search winning numbers (numeric)
  const numericOnly = clean.replace(/[^0-9]/g, '');
  let winningTickets: any[] = [];
  if (numericOnly.length >= 4) {
    winningTickets = await prisma.winningNumber.findMany({
      where: {
        OR: [
          { number: numericOnly },
          { displayNumber: { contains: clean.toUpperCase() } },
        ],
      },
      take: 12,
      include: {
        prize: {
          include: {
            draw: {
              include: { lottery: true },
            },
          },
        },
      },
    });
  }

  return serializeData({
    draws,
    lotteries,
    winningTickets,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || '';
  const results = await getSearchResults(query);

  const hasResults =
    results.draws.length > 0 ||
    results.lotteries.length > 0 ||
    results.winningTickets.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Search Results' }]} />

      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Database Search
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Search Kerala Lottery Results
        </h1>
        <p className="text-sm text-slate-600">
          Search by lottery name, draw number (e.g. KN-638, SK-67), date (e.g. 28-08-2026), or winning ticket number.
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form method="GET" action="/search" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search scheme (e.g. Karunya Plus), draw (e.g. KN-638), date or 6-digit ticket..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white text-base text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Search</span>
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Popular searches:</span>
          <Link href="/search?q=KN-638" className="bg-slate-100 px-2.5 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 font-mono font-semibold">
            KN-638
          </Link>
          <Link href="/search?q=Karunya" className="bg-slate-100 px-2.5 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 font-semibold">
            Karunya
          </Link>
          <Link href="/search?q=Sthree+Sakthi" className="bg-slate-100 px-2.5 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 font-semibold">
            Sthree Sakthi
          </Link>
          <Link href="/search?q=320327" className="bg-slate-100 px-2.5 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 font-mono font-semibold">
            320327
          </Link>
        </div>
      </div>

      {/* Results Rendering */}
      {query ? (
        <div className="space-y-10">
          {/* Section 1: Matching Winning Tickets */}
          {results.winningTickets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Winning Tickets ({results.winningTickets.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.winningTickets.map((t: any) => {
                  const prize = t.prize;
                  const draw = prize?.draw;
                  const lottery = draw?.lottery;
                  const drawDateFormatted = draw?.drawDate ? format(new Date(draw.drawDate), 'dd MMM yyyy') : '';
                  const drawDateSlug = draw?.drawDate ? format(new Date(draw.drawDate), 'yyyy-MM-dd') : '';

                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 uppercase">
                          {lottery?.name}
                        </span>
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {draw?.drawNumber}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs text-slate-500 block">{prize?.category}</span>
                          <span className="text-2xl font-black text-slate-900 font-mono">
                            {t.displayNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Prize Amount</span>
                          <span className="text-lg font-black text-emerald-700">
                            {formatINR(prize?.amount)}
                          </span>
                        </div>
                      </div>

                      {t.location && (
                        <p className="text-xs text-slate-500">
                          Agent Location: <strong className="text-slate-800">{t.location}</strong>
                        </p>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Draw Date: {drawDateFormatted}</span>
                        <Link
                          href={`/result/${drawDateSlug}/${lottery?.slug}`}
                          className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Full Draw</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 2: Matching Draws */}
          {results.draws.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Draw Results ({results.draws.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.draws.map((draw: any) => (
                  <ResultCard key={draw.id} draw={draw} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Matching Lottery Schemes */}
          {results.lotteries.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Lottery Schemes ({results.lotteries.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.lotteries.map((l: any) => (
                  <Link
                    key={l.id}
                    href={`/lottery/${l.slug}`}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 transition-all group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {l.code}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-2 group-hover:text-emerald-700 transition-colors">
                        {l.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Draw Day: <strong>{l.drawDay}</strong>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 space-y-2">
              <p className="text-base font-bold text-slate-800">No results found for &ldquo;{query}&rdquo;.</p>
              <p className="text-xs text-slate-500">
                Please check the draw number or ticket format and try again.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 space-y-2">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Enter a keyword to search verified results.</p>
          <p className="text-xs text-slate-400">
            You can search by lottery name, code, draw number, date or ticket number.
          </p>
        </div>
      )}
    </div>
  );
}
