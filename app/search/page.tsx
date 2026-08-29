import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultCard } from '@/components/ResultCard';
import { getAllNews } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { parse, isValid, format } from 'date-fns';
import { Search, Award, Calendar, ExternalLink, ShieldCheck, ArrowRight, Newspaper, Ticket } from 'lucide-react';

import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Search Kerala Lottery Results & News | Universal Lookup',
  description:
    'Search Kerala lottery results by lottery scheme, draw number (e.g. KN-638, SK-67), date or winning ticket number. Database search across verified official LOTIS results.',
  path: '/search',
  noIndex: true,
});

async function getSearchResults(query: string) {
  if (!query || query.trim().length < 2) {
    return { draws: [], lotteries: [], winningTickets: [], news: [] };
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

  // 4. Search news articles
  const allNews = getAllNews();
  const matchedNews = allNews.filter(
    a =>
      a.title.toLowerCase().includes(clean.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(clean.toLowerCase()) ||
      a.category.toLowerCase().includes(clean.toLowerCase())
  );

  return serializeData({
    draws,
    lotteries,
    winningTickets,
    news: matchedNews,
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
    results.winningTickets.length > 0 ||
    results.news.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Search Results' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Database Search
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Search Kerala Lottery Results & News
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Search by lottery scheme name, draw number (e.g. KN-638, SK-67), draw date, 6-digit ticket, or editorial news.
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm">
        <form method="GET" action="/search" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#68736E]" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search scheme (e.g. Karunya Plus), draw (e.g. KN-638), date or ticket..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white text-sm sm:text-base text-[#17201D] font-medium focus:ring-2 focus:ring-[#0B3B32] focus:outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 font-tabular"
          >
            <span>Search Database</span>
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#68736E]">
          <span>Popular searches:</span>
          {['Suvarna Keralam', 'Karunya Plus', 'KN-638', 'Thiruvonam Bumper', 'How to claim prize'].map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold text-[#17201D] border border-[#E2E7E3] transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>

      {/* Results Rendering */}
      {query ? (
        <div className="space-y-10">
          {/* Section 1: Matching Winning Tickets */}
          {results.winningTickets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#16845B]" />
                <h2 className="text-xl font-bold text-[#17201D]">
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
                      className="bg-white rounded-2xl p-5 border border-[#E2E7E3] shadow-xs space-y-3 hover:border-[#0B3B32]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B3B32] uppercase font-tabular">
                          {lottery?.name}
                        </span>
                        <span className="font-mono text-xs font-bold bg-[#F1F4F2] px-2 py-0.5 rounded text-[#17201D] border border-[#E2E7E3]">
                          {draw?.drawNumber}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs text-[#68736E] block font-medium">{prize?.category}</span>
                          <span className="text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular">
                            {t.displayNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[#68736E] block font-medium">Prize Amount</span>
                          <span className="text-lg font-black text-[#16845B] font-tabular">
                            {formatINR(prize?.amount)}
                          </span>
                        </div>
                      </div>

                      {t.location && (
                        <p className="text-xs text-[#68736E]">
                          Agent District: <strong className="text-[#17201D]">{t.location}</strong>
                        </p>
                      )}

                      <div className="pt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs">
                        <span className="text-[#68736E]">Draw Date: {drawDateFormatted}</span>
                        <Link
                          href={`/result/${drawDateSlug}/${lottery?.slug}`}
                          className="text-[#0B3B32] hover:text-[#16845B] font-bold flex items-center gap-1"
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
                <Calendar className="w-5 h-5 text-[#0B3B32]" />
                <h2 className="text-xl font-bold text-[#17201D]">
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

          {/* Section 3: Matching News & Guides */}
          {results.news.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#0B3B32]" />
                <h2 className="text-xl font-bold text-[#17201D]">
                  News & Guides ({results.news.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.news.map((art: any) => (
                  <NewsCard key={art.id} article={art} />
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Matching Lottery Schemes */}
          {results.lotteries.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#17201D]">
                Lottery Schemes ({results.lotteries.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.lotteries.map((l: any) => (
                  <Link
                    key={l.id}
                    href={`/lottery/${l.slug}`}
                    className="bg-white rounded-2xl p-5 border border-[#E2E7E3] hover:border-[#0B3B32]/40 transition-all group flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
                        {l.code}
                      </span>
                      <h3 className="font-extrabold text-[#17201D] text-base mt-2 group-hover:text-[#0B3B32] transition-colors">
                        {l.name}
                      </h3>
                      <p className="text-xs text-[#68736E] mt-0.5">
                        Draw Day: <strong className="text-[#17201D]">{l.drawDay}</strong>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2">
              <p className="text-base font-bold text-[#17201D]">No results found for &ldquo;{query}&rdquo;.</p>
              <p className="text-xs text-[#68736E]">
                Please check the draw number or ticket format and try again.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2">
          <Search className="w-8 h-8 text-[#68736E] mx-auto" />
          <p className="text-sm font-bold text-[#17201D]">Enter a keyword to search verified results.</p>
          <p className="text-xs text-[#68736E]">
            You can search by lottery name, code, draw number, date or ticket number.
          </p>
        </div>
      )}
    </div>
  );
}
