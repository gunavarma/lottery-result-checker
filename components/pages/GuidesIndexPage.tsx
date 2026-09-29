import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides, getFeaturedGuide } from '@/lib/guides';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { BookOpen, ArrowRight, ShieldCheck, Ticket, Award, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Guides & Information | KeralaDraws Knowledge Base',
  description:
    'Comprehensive guides on how to check Kerala lottery tickets, draw proceedings at Gorky Bhavan, prize tier breakdowns, claim rules, and LOTIS gazette verification.',
  path: '/guides',
  keywords: [
    'How to Check Kerala Lottery Ticket',
    'Kerala Lottery Prize Structure Explained',
    'How Kerala Lottery Results Work',
    'Kerala Lottery Claim Procedure',
    'KeralaDraws Guides',
  ],
});

export default function GuidesIndexPage() {
  const guides = getAllGuides();
  const featured = getFeaturedGuide();
  const secondary = guides.filter((g) => g.id !== featured.id);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Helpful Guides', url: '/guides' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides & Knowledge Base' },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Knowledge Base & Verification Guides
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Helpful Guides
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Authoritative guides explaining ticket anatomy, mechanical draw procedures, consolation calculations, claim regulations, and verification workflows.
        </p>
      </div>

      {/* Featured Guide Showcase */}
      {featured && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-5 hover:border-[#0B3B32]/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B3B32] text-[#C8A45D] px-3 py-1 rounded-full font-tabular">
              Featured Guide
            </span>
            <span className="text-xs text-[#68736E] font-tabular">{featured.readTime}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D]">
              <Link href={`/guides/${featured.slug}`} className="hover:text-[#0B3B32] transition-colors">
                {featured.title}
              </Link>
            </h2>
            <p className="text-xs sm:text-sm text-[#68736E] leading-relaxed max-w-3xl">
              {featured.subtitle}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/guides/${featured.slug}`}
              className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              <span>Read Full Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* All Guides Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <h2 className="text-xl font-extrabold text-[#17201D] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B3B32]" />
            <span>Essential Guides & Tutorials</span>
          </h2>
          <span className="text-xs text-[#68736E] font-tabular">
            {guides.length} Published Guides
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secondary.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-3xl p-6 border border-[#E2E7E3] hover:border-[#0B3B32]/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-[#68736E]">
                  <span className="font-bold uppercase tracking-wider bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md font-tabular">
                    {guide.category}
                  </span>
                  <span className="font-tabular">{guide.readTime}</span>
                </div>

                <h3 className="text-lg font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors leading-snug">
                  <Link href={`/guides/${guide.slug}`}>
                    {guide.title}
                  </Link>
                </h3>

                <p className="text-xs text-[#68736E] line-clamp-3 leading-relaxed">
                  {guide.excerpt}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#E2E7E3] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#68736E]">Updated: {guide.updatedAt}</span>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="font-bold text-[#0B3B32] group-hover:text-[#10201D] inline-flex items-center gap-1"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
