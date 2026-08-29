import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllNews, getFeaturedNews } from '@/lib/news';
import { NewsCard, FeaturedNewsHero } from '@/components/NewsComponents';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Newspaper, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery News & Gazette Announcements | KeralaDraws',
  description:
    'Read official Kerala lottery news, seasonal bumper announcements, prize claim compliance rules, draw date revisions, and gazette releases on KeralaDraws.',
  path: '/news',
  keywords: [
    'Kerala Lottery News',
    'Thiruvonam Bumper News',
    'Kerala State Lottery Announcements',
    'How to Claim Kerala Lottery Prize',
    'KeralaDraws',
  ],
});

export default function NewsPage() {
  const articles = getAllNews();
  const featured = getFeaturedNews();
  const secondary = articles.filter((a) => a.id !== featured.id);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'News & Announcements', url: '/news' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Lottery News & Official Updates' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Official Dispatches & Reports
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery News & Gazette Announcements
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Authoritative reporting covering upcoming bumper releases, prize structures, claim compliance regulations, and Directorate notifications.
        </p>
      </div>

      {/* Featured Hero Story */}
      <FeaturedNewsHero article={featured} />

      {/* Latest Articles Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <h2 className="text-xl font-extrabold text-[#17201D] flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#0B3B32]" />
            <span>Latest Articles & Guides</span>
          </h2>
          <span className="text-xs text-[#68736E]">
            {articles.length} verified publications
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secondary.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
