import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug, getAllNews, getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultShareBar } from '@/components/ResultShareBar';
import { Clock, User, Calendar, Tag, ArrowRight, ShieldCheck, Ticket, FileText } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Kerala Lottery News',
    };
  }

  return {
    title: `${article.title} | Kerala Lottery News`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: 'article',
      publishedTime: article.publishedAt,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllNews();
  const relatedArticles = allArticles.filter(a => a.id !== article.id).slice(0, 2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.subtitle,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kerala Lottery Results',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'News & Official Reports', href: '/news' },
          { label: article.title },
        ]}
      />

      {/* Main Article Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Article Column */}
        <article className="lg:col-span-8 space-y-8">
          {/* Header */}
          <div className="space-y-4 border-b border-[#E2E7E3] pb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-full uppercase tracking-wider font-tabular">
                {article.category}
              </span>
              <span className="text-xs text-[#68736E] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#68736E]" />
                <span>{article.readTime}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17201D] tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-[#68736E] leading-relaxed font-medium">
              {article.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-[#68736E] border-t border-[#E2E7E3]/60 pt-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#17201D]">
                  <User className="w-4 h-4 text-[#0B3B32]" />
                  <span>{article.author}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#68736E]" />
                  <span>Published: {article.publishedAt}</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[#16845B] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Editorial Record</span>
              </div>
            </div>
          </div>

          {/* Social Share Bar */}
          <ResultShareBar
            title={article.title}
            url={`/news/${article.slug}`}
          />

          {/* Body Content */}
          <div className="space-y-6 text-base sm:text-lg text-[#17201D] leading-relaxed max-w-3xl">
            {article.content.map((paragraph, idx) => (
              <p key={idx} className="text-[#17201D] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Related Scheme Box if any */}
          {article.relatedLotterySlug && (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                  Related Lottery Scheme
                </span>
                <h4 className="text-lg font-black text-[#17201D]">
                  {article.relatedLotteryName || 'Kerala Lottery'}
                </h4>
                <p className="text-xs text-[#68736E]">
                  View complete draw timetable, past winning results, and prize tiers for this scheme.
                </p>
              </div>
              <Link
                href={`/lottery/${article.relatedLotterySlug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs transition-colors shrink-0"
              >
                <span>View Scheme Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </article>

        {/* Sidebar Column */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Quick Ticket Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#0B3B32]">
              <Ticket className="w-5 h-5" />
              <h3 className="font-extrabold text-[#17201D] text-base">Check Your Ticket</h3>
            </div>
            <p className="text-xs text-[#68736E] leading-relaxed">
              Verify your 4-digit or 6-digit lottery ticket against today’s officially published draw numbers.
            </p>
            <Link
              href="/check-ticket"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs transition-colors"
            >
              <span>Launch Ticket Checker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* More Stories */}
          <div className="space-y-4">
            <div className="border-b border-[#E2E7E3] pb-2">
              <h3 className="font-extrabold text-[#17201D] text-sm uppercase tracking-wider">
                Related Dispatches
              </h3>
            </div>
            <div className="space-y-4">
              {relatedArticles.map(a => (
                <NewsCard key={a.id} article={a} compact />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
