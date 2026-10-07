import React from 'react';
import Link from '@/components/Link';
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
import { ArrowRight } from 'lucide-react';
import { getHomepageData } from '@/lib/home-data';
import { StructuredData } from '@/components/StructuredData';
import { getWebSiteSchema, getOrganizationSchema } from '@/lib/seo';
import { getTranslation, Language } from '@/lib/translations';
import { localePath } from '@/lib/i18n/config';

// Shared homepage content used by both the (en) and /[locale] trees so every
// locale renders the same sections from the same data pipeline.
//
// Server component: the locale arrives as a prop (the route is the source of
// truth) and is resolved without a hook, so no cookies()/headers() call is made
// and the page keeps its ISR caching.
export async function HomeContent({ locale = 'en' }: { locale?: Language }) {
  const t = (key: string, fallback?: string) => getTranslation(locale, key, fallback);
  const href = (path: string) => localePath(path, locale);
  const data = await getHomepageData();
  const allNews = getAllNews();
  const featuredArticle = getFeaturedNews();
  const secondaryNews = allNews.filter((a) => a.id !== featuredArticle.id).slice(0, 3);

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      <StructuredData data={getWebSiteSchema()} />
      <StructuredData data={getOrganizationSchema()} />

      {/* 1. Hero Result Terminal (Immediate 1-second Answer) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
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
              {t('home.stream_eyebrow', 'Chronological Stream')}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              {t('home.recent_results', 'Recent Official Results')}
            </h2>
          </div>
          <Link
            href={href('/results')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D45] hover:text-[#084835] transition-colors shrink-0"
          >
            <span>{t('home.view_all_results', 'View All Results')}</span>
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
              {t('home.schemes_eyebrow', 'Weekly & Bumper Schemes')}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              {t('home.active_schemes', 'Active Kerala Lottery Schemes')}
            </h2>
          </div>
          <Link
            href={href('/lotteries')}
            className="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"
          >
            <span>{t('home.all_schemes', 'All Schemes')}</span>
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
              {t('home.news_eyebrow', 'Gazette Releases')}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
              {t('home.latest_news', 'Latest Lottery News & Reports')}
            </h2>
          </div>
          <Link
            href={href('/news')}
            className="text-xs font-bold text-[#0B5D45] hover:text-[#084835] inline-flex items-center gap-1 transition-colors"
          >
            <span>{t('home.view_all_news', 'View All News')}</span>
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
        <TrustSection locale={locale} />
      </section>
    </div>
  );
}
