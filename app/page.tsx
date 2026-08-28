import React from 'react';
import Link from 'next/link';
import { prisma, serializeData } from '@/lib/prisma';
import { HeroTodayCard } from '@/components/HeroTodayCard';
import { TicketChecker } from '@/components/TicketChecker';
import { UpcomingDrawsTimeline } from '@/components/UpcomingDrawsTimeline';
import { LotteryDirectoryList } from '@/components/LotteryDirectoryList';
import { ResultCard } from '@/components/ResultCard';
import { TrustSection } from '@/components/TrustSection';
import { NotificationBanner } from '@/components/NotificationBanner';
import { getAllNews, getFeaturedNews } from '@/lib/news';
import { NewsCard, FeaturedNewsHero } from '@/components/NewsComponents';
import { Award, Calendar, ArrowRight, ShieldCheck, Search, Newspaper, Bell } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

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
  const allNews = getAllNews();
  const featuredArticle = getFeaturedNews();
  const secondaryNews = allNews.filter(a => a.id !== featuredArticle.id).slice(0, 3);

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

      {/* Hero Editorial Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <span className="text-xs font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Kerala Lottery Results
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17201D] tracking-tight leading-tight">
            Today's Kerala Lottery Results
          </h1>
          <p className="text-sm sm:text-base text-[#68736E] leading-relaxed">
            Official lottery results, prize structures and ticket checking — updated as results are published by the Directorate of Kerala State Lotteries.
          </p>
        </div>

        {/* Level 1 Visual Priority: Today's Result Centerpiece + Ticket Checker */}
        <div className="space-y-8">
          <HeroTodayCard initialData={data} />
          <TicketChecker />
        </div>
      </section>

      {/* Level 2 Visual Priority: Upcoming Draws Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UpcomingDrawsTimeline />
      </section>

      {/* Level 2 Visual Priority: Active Lottery Directory (Compact List Layout) */}
      <section id="lotteries" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Kerala State Schemes
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Active Kerala Lottery Schemes
            </h2>
          </div>
          <Link
            href="/prize-structure"
            className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
          >
            <span>All Prize Structures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <LotteryDirectoryList lotteries={data.popularLotteries || []} />
      </section>

      {/* Level 3 Visual Priority: Editorial News Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Editorial & Analysis
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Latest Lottery News & Reports
            </h2>
          </div>
          <Link
            href="/news"
            className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
          >
            <span>View All News</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 1 Featured + Secondary Articles Grid */}
        <div className="space-y-6">
          <FeaturedNewsHero article={featuredArticle} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondaryNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Level 3 Visual Priority: Previous Results Archive Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Chronological Archive
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Recent Official Results
            </h2>
          </div>
          <Link
            href="/previous-results"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B32] hover:text-[#16845B] transition-colors shrink-0"
          >
            <span>Explore Complete Results Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.latestDraws && data.latestDraws.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.latestDraws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-[#E2E7E3] text-center text-[#68736E] text-xs">
            Results are currently synchronizing with the official LOTIS server.
          </div>
        )}
      </section>

      {/* Notification Opt-in Prompt */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner />
      </section>

      {/* Trust & Verification 4-Step Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrustSection />
      </section>
    </div>
  );
}
