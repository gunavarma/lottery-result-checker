import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { NewsArticle } from '@/lib/news';

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  return (
    <article
      className={`bg-white rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] bg-[#F1F4F2] px-2.5 py-0.5 rounded tracking-wide uppercase font-tabular">
            {article.category}
          </span>
          <span className="text-[11px] text-[#68736E] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#68736E]" />
            <span>{article.readTime}</span>
          </span>
        </div>

        <h3
          className={`font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors leading-snug ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          }`}
        >
          <Link href={`/news/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        {!compact && (
          <p className="text-xs text-[#68736E] line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </div>

      <div className="pt-4 mt-3 border-t border-[#E2E7E3]/60 flex items-center justify-between text-xs text-[#68736E]">
        <span>{article.publishedAt}</span>
        <Link
          href={`/news/${article.slug}`}
          aria-label={`Read article: ${article.title}`}
          className="font-bold text-[#0B3B32] group-hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
        >
          <span>Read Article</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}

export function FeaturedNewsHero({ article }: { article: NewsArticle }) {
  return (
    <div className="bg-[#10201D] text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0B3B32]/40 relative overflow-hidden group">
      <div className="relative z-10 space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#C8A45D] bg-[#C8A45D]/15 border border-[#C8A45D]/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Featured Report
          </span>
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>{article.readTime}</span>
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-slate-100 transition-colors">
          <Link href={`/news/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed">
          {article.subtitle}
        </p>

        <div className="pt-2 flex items-center gap-4 text-xs">
          <Link
            href={`/news/${article.slug}`}
            aria-label={`Read full report: ${article.title}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-[#C8A45D]" />
            <span>Read Full Report</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-slate-400">Published {article.publishedAt}</span>
        </div>
      </div>
    </div>
  );
}
