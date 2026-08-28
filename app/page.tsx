import React from 'react';
import Link from 'next/link';
import { prisma, serializeData } from '@/lib/prisma';
import { HeroTodayCard } from '@/components/HeroTodayCard';
import { ResultCard } from '@/components/ResultCard';
import { DrawScheduleTable } from '@/components/DrawScheduleTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { SeoContent } from '@/components/SeoContent';
import { NotificationBanner } from '@/components/NotificationBanner';
import { Award, Calendar, ArrowRight, ShieldCheck, Search, ChevronRight } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';

export const revalidate = 60;

async function getHomepageData() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [todayDraw, latestDraws, popularLotteries] = await Promise.all([
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
        take: 6,
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            take: 3,
            include: {
              winningNumbers: { take: 5 },
            },
          },
        },
      }),
      prisma.lottery.findMany({
        where: { active: true },
        take: 8,
        include: {
          draws: {
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
            take: 1,
            include: {
              prizes: {
                where: { orderIndex: 0 },
                include: { winningNumbers: { take: 1 } },
              },
            },
          },
        },
      }),
    ]);

    const latestDraw = latestDraws[0] || null;

    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const istHour = istTime.getUTCHours();
    const istMinutes = istTime.getUTCMinutes();

    let liveStatus: 'WAITING' | 'CHECKING' | 'PUBLISHED' | 'FAILED' = 'WAITING';
    if (todayDraw && todayDraw.status === 'PUBLISHED') {
      liveStatus = 'PUBLISHED';
    } else if (istHour === 15 || (istHour === 16 && istMinutes <= 30)) {
      liveStatus = 'CHECKING';
    } else {
      liveStatus = 'WAITING';
    }

    return serializeData({
      isTodayAvailable: !!todayDraw,
      liveStatus,
      todayDraw: todayDraw || null,
      latestDraw: latestDraw || null,
      latestDraws,
      popularLotteries,
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      isTodayAvailable: false,
      liveStatus: 'WAITING',
      todayDraw: null,
      latestDraw: null,
      latestDraws: [],
      popularLotteries: [],
    };
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kerala Lottery Results',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        <HeroTodayCard initialData={data} />
        <NotificationBanner />
      </section>

      {/* Search Bar Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Search Kerala Lottery Results Database
            </h2>
            <p className="text-xs text-slate-500">
              Search past draws, specific draw numbers (e.g. KN-638, SS-534) or check winning ticket numbers.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Open Result Search</span>
          </Link>
        </div>
      </section>

      {/* Official Source Transparency Badge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OfficialSourceBadge
          sourceUrl={data.latestDraw?.sourceUrl}
          drawNumber={data.latestDraw?.drawNumber}
        />
      </section>

      {/* Latest Draw Results Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Recent Official Results
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Latest Kerala Lottery Results
            </h2>
          </div>
          <Link
            href="/previous-results"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <span>View All Results</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {data.latestDraws && data.latestDraws.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.latestDraws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
            Results are currently synchronizing with the official LOTIS server.
          </div>
        )}
      </section>

      {/* Active Lotteries Scheme List */}
      <section id="lotteries" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
            Kerala State Schemes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Kerala Lottery Schemes
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.popularLotteries?.map((lottery: any) => (
            <Link
              key={lottery.id}
              href={`/lottery/${lottery.slug}`}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {lottery.code}
                </span>
                <h4 className="font-extrabold text-slate-900 text-base mt-2 group-hover:text-emerald-700 transition-colors">
                  {lottery.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Draw Day: <strong className="text-slate-700">{lottery.drawDay}</strong>
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>View Results</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Draw Schedule Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
            Timetable & Schedule
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kerala State Lottery Calendar Preview
          </h2>
        </div>

        <DrawScheduleTable />
      </section>

      {/* Informative SEO Content & FAQs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SeoContent />
      </section>
    </div>
  );
}
