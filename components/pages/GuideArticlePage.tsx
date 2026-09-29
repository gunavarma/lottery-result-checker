import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuideBySlug, getAllGuides } from '@/lib/guides';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { ResultShareBar } from '@/components/ResultShareBar';
import { constructMetadata, getBreadcrumbSchema, getNewsArticleSchema, getFAQSchema } from '@/lib/seo';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Award,
  HelpCircle,
  CheckCircle2,
  List,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return constructMetadata({
      title: 'Guide Not Found | KeralaDraws',
      path: `/guides/${slug}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `${guide.title} | KeralaDraws Guide`,
    description: guide.excerpt || guide.subtitle,
    path: `/guides/${guide.slug}`,
    keywords: [
      guide.title,
      'Kerala lottery guide',
      'Kerala lottery rules',
      'Kerala lottery verification',
      'KeralaDraws',
    ],
  });
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const allGuides = getAllGuides();
  const relatedGuides = allGuides.filter((g) => g.id !== guide.id).slice(0, 2);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ];

  const articleSchema = getNewsArticleSchema({
    title: guide.title,
    description: guide.subtitle,
    slug: `guides/${guide.slug}`,
    publishedAt: guide.publishedAt,
    updatedAt: guide.updatedAt,
    author: guide.author,
  });

  const faqSchema = getFAQSchema(guide.faqs);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), articleSchema, faqSchema]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: guide.category },
        ]}
      />

      {/* Guide Header */}
      <div className="space-y-4 border-b border-[#E2E7E3] pb-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B3B32] text-[#C8A45D] px-3 py-1 rounded-full font-tabular">
            {guide.category}
          </span>
          <span className="text-xs text-[#68736E] font-tabular">{guide.readTime}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight leading-tight">
          {guide.title}
        </h1>

        <p className="text-sm sm:text-base text-[#68736E] leading-relaxed">
          {guide.subtitle}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-2">
          <span className="flex items-center gap-1 font-tabular">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated: {guide.updatedAt}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{guide.author}</span>
          </span>
        </div>
      </div>

      {/* Table of Contents */}
      {guide.tableOfContents && guide.tableOfContents.length > 0 && (
        <div className="bg-[#F7F7F4] rounded-3xl p-6 sm:p-7 border border-[#E2E7E3] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17201D] uppercase tracking-wider font-tabular">
            <List className="w-4 h-4 text-[#0B3B32]" />
            <span>In this Guide:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {guide.tableOfContents.map((toc, i) => (
              <li key={toc.id}>
                <a
                  href={`#${toc.id}`}
                  className="text-[#0B3B32] hover:text-[#17201D] hover:underline flex items-center gap-2 py-1 font-medium"
                >
                  <span className="w-5 h-5 rounded-md bg-white border border-[#E2E7E3] flex items-center justify-center font-bold text-[10px] text-[#17201D] shrink-0 font-tabular">
                    {i + 1}
                  </span>
                  <span>{toc.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guide Body Sections */}
      <div className="space-y-10 text-sm sm:text-base text-[#17201D] leading-relaxed">
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] border-b border-[#E2E7E3] pb-2">
              {section.title}
            </h2>

            <div className="space-y-3">
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[#17201D] leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {section.tips && section.tips.length > 0 && (
              <div className="bg-[#F1F4F2] p-4 sm:p-5 rounded-2xl border border-[#0B3B32]/20 space-y-1.5 my-3">
                <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                  Verification Note:
                </span>
                {section.tips.map((tip, tIdx) => (
                  <p key={tIdx} className="text-xs text-[#17201D] leading-relaxed">
                    {tip}
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Action Shortcut Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-[#17201D]">
            Ready to verify your ticket?
          </h3>
          <p className="text-xs text-[#68736E]">
            Check your number against official certified winning lists with our free tool.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/check-ticket"
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Ticket className="w-4 h-4 text-[#C8A45D]" />
            <span>Check Ticket</span>
          </Link>
          <Link
            href="/kerala-lottery-result-today"
            className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <span>Today's Result</span>
          </Link>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      {guide.faqs && guide.faqs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#0B3B32]" />
            <h3 className="text-lg sm:text-xl font-extrabold text-[#17201D]">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {guide.faqs.map((faq, idx) => (
              <div key={idx} className="bg-[#F7F7F4] p-4 sm:p-5 rounded-2xl border border-[#E2E7E3] space-y-1.5">
                <h4 className="font-bold text-[#17201D] text-sm sm:text-base">{faq.question}</h4>
                <p className="text-[#68736E] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Bar */}
      <ResultShareBar
        title={guide.title}
        url={`/guides/${guide.slug}`}
      />

      {/* Related Guides */}
      {relatedGuides.length > 0 && (
        <div className="pt-8 border-t border-[#E2E7E3] space-y-6">
          <h3 className="text-xl font-extrabold text-[#17201D]">
            More Helpful Guides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {relatedGuides.map((rel) => (
              <div
                key={rel.id}
                className="bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors space-y-2 group shadow-xs"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3B32] block font-tabular">
                  {rel.category}
                </span>
                <h4 className="text-base font-bold text-[#17201D] group-hover:text-[#0B3B32] transition-colors">
                  <Link href={`/guides/${rel.slug}`}>{rel.title}</Link>
                </h4>
                <p className="text-xs text-[#68736E] line-clamp-2">
                  {rel.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
