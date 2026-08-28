import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllNews, getFeaturedNews } from '@/lib/news';
import { NewsCard, FeaturedNewsHero } from '@/components/NewsComponents';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Newspaper, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kerala Lottery News & Official Updates | Announcements & Guides',
  description: 'Official news, bumper draw announcements, prize claim procedures, schedule changes, and analysis from the Kerala State Lotteries ecosystem.',
};

export default function NewsPage() {
  const articles = getAllNews();
  const featured = getFeaturedNews();
  const secondary = articles.filter(a => a.id !== featured.id);

  const categories = ['All', 'Bumper Lotteries', 'Scheme Updates', 'Claim Rules', 'Draw Analysis'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
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
          Kerala Lottery News & Official Reports
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Authoritative information covering upcoming bumper releases, prize structures, claim compliance regulations, and Directorate notifications.
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

      {/* Official Guidelines Trust Callout */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0B3B32]">
            <ShieldCheck className="w-5 h-5 text-[#16845B]" />
            <span className="text-xs font-bold uppercase tracking-wider">Statutory Verification Note</span>
          </div>
          <h3 className="text-lg font-bold text-[#17201D]">
            Official Directorate Publication Guidelines
          </h3>
          <p className="text-xs text-[#68736E] max-w-2xl">
            All news summaries are verified against official gazettes published by the Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram.
          </p>
        </div>
        <Link
          href="/about"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors shrink-0"
        >
          <span>Claim Rules & Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
