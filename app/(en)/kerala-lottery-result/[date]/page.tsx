import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { constructMetadata, getBreadcrumbSchema, getFAQSchema, SITE_URL } from '@/lib/seo';
import { getOrSetCache } from '@/lib/cache';
import {
  isValidDateFormat,
  parseDateOnlyUtc,
  formatDateOnly,
  getIstDateRange,
  getAdjacentAvailableDates,
} from '@/lib/date';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Ticket,
  HelpCircle,
  FileText,
  Clock,
  MapPin,
  Award,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ date: string }>;
}

async function getHistoricalDrawData(dateStr: string) {
  if (!isValidDateFormat(dateStr)) return null;

  const cacheKey = `kerala_lottery_result_page_${dateStr}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const targetDate = parseDateOnlyUtc(dateStr);
      const { formattedDisplay } = getIstDateRange(dateStr);
      const adjacent = await getAdjacentAvailableDates(dateStr);

      const draws = await prisma.draw.findMany({
        where: {
          drawDate: targetDate,
          status: 'PUBLISHED',
        },
        include: {
          lottery: true,
          prizes: {
            orderBy: { orderIndex: 'asc' },
            include: {
              winningNumbers: {
                orderBy: { id: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!draws || draws.length === 0) return null;

      const [year, month] = dateStr.split('-');

      return serializeData({
        dateStr,
        year,
        month,
        dateFormatted: formattedDisplay,
        prevDate: adjacent.prevAvailableDate,
        nextDate: adjacent.nextAvailableDate,
        draws,
      });
    },
    { ttlMs: 300_000, swrMs: 86400_000 }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date: dateStr } = await params;
  const data = await getHistoricalDrawData(dateStr);

  if (!data || !data.draws || data.draws.length === 0) {
    return constructMetadata({
      title: 'Kerala Lottery Result Not Found',
      description: `No verified official Kerala State Lottery results exist for ${dateStr}. Check the official weekly timetable or previous draw dates.`,
      path: `/kerala-lottery-result/${dateStr}`,
      noIndex: true,
    });
  }

  const primaryDraw = data.draws[0];
  const firstPrize = primaryDraw.prizes?.find(
    (p: any) => p.orderIndex === 0 || p.tierNumber === 1 || p.category.toLowerCase().includes('1st')
  );
  const firstPrizeText = firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore';
  const firstWinner = firstPrize?.winningNumbers?.[0]?.displayNumber;
  const winnerSnippet = firstWinner ? ` 1st Prize ticket: ${firstWinner}.` : '';

  const title = `${primaryDraw.lottery.name} (${primaryDraw.drawNumber}) Result ${data.dateFormatted} – Winning Numbers | KeralaDraws`;
  const description = `Check official Kerala lottery result for ${data.dateFormatted}. ${primaryDraw.lottery.name} ${primaryDraw.drawNumber} 1st prize ${firstPrizeText}.${winnerSnippet} Complete prize structure, 1st to 9th winning numbers and official LOTIS gazette verification.`;

  return constructMetadata({
    title,
    description,
    path: `/kerala-lottery-result/${dateStr}`,
    keywords: [
      `${primaryDraw.lottery.name} result`,
      `${primaryDraw.lottery.name} ${primaryDraw.drawNumber}`,
      `Kerala lottery result ${data.dateFormatted}`,
      `Kerala lottery result ${dateStr}`,
      `${primaryDraw.lottery.code} winning numbers`,
      'Kerala State Lotteries official result',
      'KeralaDraws',
    ],
  });
}

export default async function KeralaLotteryResultDatePage({ params }: PageProps) {
  const { date: dateStr } = await params;
  const data = await getHistoricalDrawData(dateStr);

  // Strict anti-soft-404: If date has no verified draw, return authentic HTTP 404
  if (!data || !data.draws || data.draws.length === 0) {
    notFound();
  }

  const { dateFormatted, year, month, prevDate, nextDate, draws } = data;
  const mainDraw = draws[0];

  const firstPrize = mainDraw.prizes?.find(
    (p: any) => p.orderIndex === 0 || p.tierNumber === 1 || p.category.toLowerCase().includes('1st')
  );
  const firstWinner = firstPrize?.winningNumbers?.[0];

  // Breadcrumb Schema
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Kerala Lottery Results', url: `${SITE_URL}/kerala-lottery-results` },
    { name: dateFormatted, url: `${SITE_URL}/kerala-lottery-result/${dateStr}` },
  ]);

  // WebPage Schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${mainDraw.lottery.name} (${mainDraw.drawNumber}) Result – ${dateFormatted}`,
    description: `Official Kerala State Lottery result for ${dateFormatted}, including 1st prize winning number ${firstWinner?.displayNumber || ''} and complete prize structure.`,
    url: `${SITE_URL}/kerala-lottery-result/${dateStr}`,
    datePublished: mainDraw.drawDate,
    dateModified: mainDraw.verifiedAt || mainDraw.updatedAt || mainDraw.drawDate,
    mainEntity: {
      '@type': 'Event',
      name: `${mainDraw.lottery.name} Lottery Draw ${mainDraw.drawNumber}`,
      startDate: `${dateStr}T15:00:00+05:30`,
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: 'Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Thiruvananthapuram',
          addressRegion: 'Kerala',
          addressCountry: 'IN',
        },
      },
    },
  };

  // Real FAQs based on genuine draw data
  const faqs = [
    {
      question: `What is the 1st prize winning ticket for ${mainDraw.lottery.name} (${mainDraw.drawNumber}) on ${dateFormatted}?`,
      answer: firstWinner
        ? `The 1st prize of ${firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'} was won by ticket number ${firstWinner.displayNumber}${firstWinner.location ? ` (sold in ${firstWinner.location})` : ''}.`
        : `Please inspect the verified prize table above for certified winning ticket numbers.`,
    },
    {
      question: `How can I check if my ticket won a prize in the ${mainDraw.drawNumber} draw?`,
      answer: `Compare the 2-letter series and 6 digits for the 1st prize, or the last 4 digits for the 4th through 9th prizes against the official numbers published above, or enter your ticket number in our instant Ticket Checker.`,
    },
    {
      question: `What is the deadline to claim prize money for Kerala lottery draw ${mainDraw.drawNumber}?`,
      answer: `Prizes must be claimed within 30 days from the draw date (${dateFormatted}) with the original ticket and valid government photo ID at the Directorate of Kerala State Lotteries or designated district lottery offices.`,
    },
  ];

  const faqSchema = getFAQSchema(faqs);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Schema.org JSON-LD Structured Data */}
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={webPageSchema} />
      <StructuredData data={faqSchema} />

      {/* Visible Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results', href: '/kerala-lottery-results' },
          { label: dateFormatted },
        ]}
      />

      {/* Top Chronological & Quick Jump Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4] p-3 sm:p-4 rounded-2xl border border-[#E2E7E3] text-xs font-bold">
        <div className="flex items-center gap-2">
          {prevDate ? (
            <Link
              href={`/kerala-lottery-result/${prevDate}`}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#0B3B32]" />
              <span>Previous Draw ({prevDate})</span>
            </Link>
          ) : (
            <span className="text-[#68736E] px-2">Earliest Verified Archive</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/lottery/${mainDraw.lottery.slug}`}
            className="bg-white hover:bg-[#E2E7E3] text-[#0B3B32] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors"
          >
            {mainDraw.lottery.name} Hub
          </Link>
          <Link
            href={`/kerala-lottery-results/${year}/${month}`}
            className="bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors font-tabular"
          >
            {month}/{year} Archive
          </Link>
          <Link
            href="/ticket-checker"
            className="bg-[#0B3B32] hover:bg-[#16845B] text-white px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Check Ticket</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {nextDate ? (
            <Link
              href={`/kerala-lottery-result/${nextDate}`}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#E2E7E3] text-[#17201D] px-3 py-1.5 rounded-xl border border-[#E2E7E3] transition-colors"
            >
              <span>Next Draw ({nextDate})</span>
              <ChevronRight className="w-4 h-4 text-[#0B3B32]" />
            </Link>
          ) : (
            <Link
              href="/kerala-lottery-result-today"
              className="inline-flex items-center gap-1 text-[#0B3B32] hover:underline"
            >
              <span>Today&apos;s Live Draw →</span>
            </Link>
          )}
        </div>
      </div>

      {/* Page Header with Single Semantic H1 */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular">
            Kerala State Lotteries Official Gazette
          </span>
          <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]">
            {mainDraw.lottery.code}
          </span>
          <span className="font-bold text-xs bg-[#0B3B32] text-white px-3 py-0.5 rounded-md">
            CERTIFIED RESULT
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          {mainDraw.lottery.name} Result – {dateFormatted}
        </h1>

        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Official winning ticket numbers and complete prize tier breakdown for{' '}
          <strong>{mainDraw.lottery.name} (Draw No. {mainDraw.drawNumber})</strong> held at Gorky Bhavan,
          Thiruvananthapuram on {dateFormatted} at {mainDraw.drawTime}. Sourced directly from the official
          Directorate of Kerala State Lotteries gazette.
        </p>
      </div>

      {/* Main Draw Results Cards */}
      <div className="space-y-8">
        {draws.map((draw: any) => {
          const drawFirstPrize = draw.prizes?.find(
            (p: any) => p.orderIndex === 0 || p.tierNumber === 1 || p.category.toLowerCase().includes('1st')
          );
          const drawFirstWinner = drawFirstPrize?.winningNumbers?.[0];

          return (
            <article
              key={draw.id}
              className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6"
            >
              {/* Draw Summary Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]">
                      {draw.lottery.code}
                    </span>
                    <span className="text-xs text-[#68736E] font-medium">
                      Draw Number: <strong className="text-[#17201D]">{draw.drawNumber}</strong>
                    </span>
                    {draw.sourceDocumentUrl && (
                      <OfficialSourceBadge
                        sourceUrl={draw.sourceDocumentUrl}
                        drawNumber={draw.drawNumber}
                        drawDate={dateFormatted}
                      />
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D]">
                    {draw.lottery.name} ({draw.drawNumber})
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-[#68736E] pt-1">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#0B3B32]" />
                      {dateFormatted}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0B3B32]" />
                      {draw.drawTime}
                    </span>
                  </div>
                </div>

                {/* 1st Prize Highlight Box */}
                {drawFirstWinner && (
                  <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#E2E7E3] text-center shrink-0 min-w-[220px]">
                    <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                      1st Prize ({drawFirstPrize ? formatINR(drawFirstPrize.amount) : '₹1 Crore'})
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#16845B] block mt-1">
                      {drawFirstWinner.displayNumber}
                    </span>
                    {drawFirstWinner.location && (
                      <span className="text-[11px] text-[#68736E] font-medium block mt-1 inline-flex items-center gap-1 justify-center">
                        <MapPin className="w-3 h-3 text-[#0B3B32]" />
                        Sold in {drawFirstWinner.location}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Complete Prize Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#17201D]">
                    Official Prize Category Breakdown & Winning Numbers
                  </h3>
                  <span className="text-xs text-[#68736E]">
                    {draw.prizes?.length || 0} Prize Categories
                  </span>
                </div>

                <PrizeTable
                  lotteryName={draw.lottery.name}
                  drawNumber={draw.drawNumber}
                  prizes={draw.prizes}
                />
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E7E3]">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/lottery/${draw.lottery.slug}`}
                    className="inline-flex items-center gap-1.5 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>All {draw.lottery.name} Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/ticket-checker"
                    className="inline-flex items-center gap-1.5 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2 rounded-xl font-bold text-xs transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Verify My Ticket</span>
                  </Link>
                </div>

                <ResultShareBar
                  title={`${draw.lottery.name} (${draw.drawNumber}) Result on ${dateFormatted}`}
                  url={`/kerala-lottery-result/${dateStr}`}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Frequently Asked Questions Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#17201D]">
          <HelpCircle className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-lg sm:text-xl font-extrabold">
            Frequently Asked Questions: {mainDraw.lottery.name} ({dateFormatted})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
              <h3 className="text-xs font-bold text-[#17201D] leading-snug">
                {faq.question}
              </h3>
              <p className="text-xs text-[#68736E] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Authoritative Trust & Verification Notice */}
      <div className="bg-[#F7F7F4] rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16845B] shrink-0" />
          <span>
            <strong>Official Source Verification:</strong> Sourced directly from the Directorate of Kerala State Lotteries (LOTIS portal). KeralaDraws is an independent informational publisher.
          </span>
        </div>
        <Link
          href="/disclaimer"
          className="font-bold text-[#0B3B32] hover:underline shrink-0"
        >
          Read Full Disclaimer →
        </Link>
      </div>
    </div>
  );
}
