import React from 'react';
import Link from 'next/link';
import { prisma, serializeData } from '@/lib/prisma';
import { HeroTodayCard } from '@/components/HeroTodayCard';
import { ResultFinder } from '@/components/ResultFinder';
import { RecentResultsStream } from '@/components/RecentResultsStream';
import { TicketChecker } from '@/components/TicketChecker';
import { UpcomingDrawsTimeline } from '@/components/UpcomingDrawsTimeline';
import { LotteryDirectoryList } from '@/components/LotteryDirectoryList';
import { TrustSection } from '@/components/TrustSection';
import { NotificationBanner } from '@/components/NotificationBanner';
import { getAllNews, getFeaturedNews } from '@/lib/news';
import { NewsCard, FeaturedNewsHero } from '@/components/NewsComponents';
import { Award, Calendar, ArrowRight, ShieldCheck, Search, Newspaper, Bell } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { getOrSetCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function getHomepageData() {
  return getOrSetCache(
    'homepage_data',
    async () => {
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
          liveStatus: 'WAITING' as const,
          todayDraw: null,
          latestDraw: null,
          latestDraws: [],
          popularLotteries: [],
        };
      }
    },
    { ttlMs: 30_000, swrMs: 300_000 }
  );
}

export default async function HomePage() {
  const data = await getHomepageData();
  const allNews = getAllNews();
  const featuredArticle = getFeaturedNews();
  const secondaryNews = allNews.filter((a) => a.id !== featuredArticle.id).slice(0, 3);

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      {/* 1. Hero Result Terminal (Immediate 1-second Answer) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        <div className="space-y-2 max-w-3xl">
          <span className="text-xs font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">
            KeralaDraws • Official Gazette Synchronized
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17201D] tracking-tight leading-tight">
            Kerala Lottery Results Today & Winning Numbers
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B66] leading-relaxed">
            Independent Kerala State Lottery results terminal, live 3:00 PM draw status, prize structures, and instant ticket verification — synchronized directly with official LOTIS gazette publications.
          </p>
        </div>

        {/* Today's Result Centerpiece */}
        <HeroTodayCard initialData={data} />

        {/* 2. Result Finder (Quick Jump to Today, Yesterday, Any Date or Scheme) */}
        <ResultFinder lotteries={data.popularLotteries || []} />
      </section>

      {/* 3. Scannable Recent Results Stream (Table / List Hybrid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">
              Chronological Stream
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Recent Official Results
            </h2>
          </div>
          <Link
            href="/results"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D45] hover:text-[#084835] transition-colors shrink-0"
          >
            <span>View All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <RecentResultsStream draws={data.latestDraws || []} />
      </section>

      {/* 4. Ticket Verification Terminal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TicketChecker />
      </section>

      {/* 5. Upcoming Draws Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UpcomingDrawsTimeline />
      </section>

      {/* 6. Active Kerala Schemes Directory */}
      <section id="lotteries" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">
              Weekly & Bumper Schemes
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Active Kerala Lottery Schemes
            </h2>
          </div>
          <Link
            href="/lotteries"
            className="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"
          >
            <span>All Schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <LotteryDirectoryList lotteries={data.popularLotteries || []} />
      </section>

      {/* 7. Editorial Gazette News & Analysis */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">
              Gazette Releases
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              Latest Lottery News & Reports
            </h2>
          </div>
          <Link
            href="/news"
            className="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"
          >
            <span>View All News</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-6">
          <FeaturedNewsHero article={featuredArticle} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondaryNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Notification Opt-in Prompt */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner />
      </section>

      {/* 9. Trust & Verification 4-Step Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrustSection />
      </section>
    </div>
  );
}
