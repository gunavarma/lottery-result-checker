import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug, getAllNews, getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultShareBar } from '@/components/ResultShareBar';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema, getNewsArticleSchema } from '@/lib/seo';
import { Clock, User, Calendar, Tag, ArrowRight, ShieldCheck, Ticket, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) {
    return constructMetadata({
      title: 'Article Not Found | KeralaDraws News',
      path: `/news/${slug}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `${article.title} | KeralaDraws`,
    description: article.excerpt || article.subtitle,
    path: `/news/${article.slug}`,
    keywords: [article.category, article.relatedLotteryName || 'Kerala Lottery', 'KeralaDraws News'],
  });
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
  const relatedArticles = allArticles.filter((a) => a.id !== article.id).slice(0, 2);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'News', url: '/news' },
    { name: article.title, url: `/news/${article.slug}` },
  ];

  const articleSchema = getNewsArticleSchema({
    title: article.title,
    description: article.subtitle,
    slug: article.slug,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: article.author,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), articleSchema]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'News & Updates', href: '/news' },
          { label: article.category },
        ]}
      />

      {/* Article Header */}
      <div className="space-y-4 border-b border-[#E2E7E3] pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-full border border-[#0B3B32]/10 font-tabular">
            {article.category}
          </span>
          {article.relatedLotteryName && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C8A45D]/15 text-[#A66A00] px-3 py-1 rounded-full border border-[#C8A45D]/30 font-tabular">
              {article.relatedLotteryName}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#17201D] tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base text-[#68736E] leading-relaxed">
          {article.subtitle}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-2">
          <span className="flex items-center gap-1 font-tabular">
            <Calendar className="w-3.5 h-3.5" />
            <span>{article.publishedAt}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{article.author}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-tabular">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTime}</span>
          </span>
        </div>
      </div>

      {/* Article Content */}
      <article className="prose prose-slate max-w-none text-[#17201D] leading-relaxed space-y-5 text-sm sm:text-base">
        {article.content.map((paragraph, index) => (
          <p key={index} className="text-[#17201D] leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>

      {/* Share and Related Schemes */}
      <div className="pt-6 border-t border-[#E2E7E3] flex flex-wrap items-center justify-between gap-4">
        {article.relatedLotterySlug ? (
          <Link
            href={`/lotteries/${article.relatedLotterySlug}`}
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <span>View {article.relatedLotteryName} Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/results"
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <span>Explore All Results</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        <ResultShareBar
          title={article.title}
          url={`/news/${article.slug}`}
        />
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="pt-10 border-t border-[#E2E7E3] space-y-6">
          <h2 className="text-xl font-extrabold text-[#17201D]">
            More Kerala Lottery News & Reports
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedArticles.map((rel) => (
              <NewsCard key={rel.id} article={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
