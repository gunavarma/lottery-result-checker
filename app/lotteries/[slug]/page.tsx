import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { PrizeTable } from '@/components/PrizeTable';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { NotificationBanner } from '@/components/NotificationBanner';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { Award, Calendar, Clock, Ticket, ShieldCheck, ChevronRight, FileText, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const lottery = await prisma.lottery.findUnique({
      where: { slug },
    });

    if (!lottery) {
      return constructMetadata({
        title: 'Kerala Lottery Scheme Not Found',
        path: `/lotteries/${slug}`,
        noIndex: true,
      });
    }

    return constructMetadata({
      title: `${lottery.name} Result Today | Kerala Lottery ${lottery.code}`,
      description: `Check official ${lottery.name} (${lottery.code}) Kerala lottery results, draw schedule (${lottery.drawDay}), 1st prize winning numbers, prize breakdown and LOTIS gazette records.`,
      path: `/lotteries/${slug}`,
      keywords: [
        `${lottery.name} result`,
        `${lottery.name} lottery result today`,
        `${lottery.name} winning numbers`,
        `${lottery.name} prize structure`,
        `${lottery.code} lottery result`,
        'KeralaDraws',
      ],
    });
  } catch (error) {
    return constructMetadata({
      title: 'Kerala Lottery Scheme',
      path: '/lotteries',
    });
  }
}

async function getLotterySchemeData(slug: string) {
  try {
    const lottery = await prisma.lottery.findUnique({
      where: { slug },
      include: {
        draws: {
          where: { status: 'PUBLISHED' },
          orderBy: { drawDate: 'desc' },
          take: 10,
          include: {
            lottery: true,
            prizes: {
              orderBy: { orderIndex: 'asc' },
              include: {
                winningNumbers: true,
              },
            },
          },
        },
      },
    });

    return lottery ? serializeData(lottery) : null;
  } catch (error) {
    console.error('Error in getLotterySchemeData:', error);
    return null;
  }
}

export default async function LotterySchemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lottery = await getLotterySchemeData(slug);

  if (!lottery) {
    notFound();
  }

  const latestDraw = lottery.draws?.[0] || null;
  const pastDraws = lottery.draws?.slice(1) || [];
  const relatedNews = getRelatedNewsForLottery(lottery.slug);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Lottery Schemes', url: '/lotteries' },
    { name: lottery.name, url: `/lotteries/${lottery.slug}` },
  ];

  const faqs = [
    {
      question: `When is the ${lottery.name} lottery draw held?`,
      answer: `The official ${lottery.name} (${lottery.code}) draw takes place every ${lottery.drawDay} at 3:00 PM IST at Gorky Bhavan, Thiruvananthapuram. Official gazette results are certified and published around 4:30 PM.`,
    },
    {
      question: `What is the ticket price for ${lottery.name}?`,
      answer: `The official ticket price for ${lottery.name} is ₹${lottery.ticketPrice} per ticket.`,
    },
    {
      question: `How can I verify my ${lottery.name} winning ticket?`,
      answer: `You can use the instant KeralaDraws Ticket Checker tool or compare your 6-digit ticket number against the official winning list published on this page. All winning data is verified against the official LOTIS government portal.`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Lottery Directory', href: '/lotteries' },
          { label: lottery.name },
        ]}
      />

      {/* Scheme Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]">
                CODE: {lottery.code}
              </span>
              {lottery.isBumper && (
                <span className="font-bold text-xs bg-[#C8A45D]/15 text-[#A66A00] border border-[#C8A45D]/30 px-3 py-1 rounded-md">
                  BUMPER SCHEME
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
              {lottery.name} Kerala Lottery Results
            </h1>
            <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl leading-relaxed">
              {lottery.description ||
                `Official ${lottery.name} (${lottery.code}) Kerala State Lottery scheme conducted weekly by the Directorate of Kerala State Lotteries.`}
            </p>
          </div>

          {latestDraw?.prizes?.[0] && (
            <div className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] text-center shrink-0 min-w-[200px]">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">1st Prize</span>
              <span className="text-2xl sm:text-3xl font-black text-[#16845B] block mt-0.5 font-tabular">
                {formatINR(latestDraw.prizes[0].amount)}
              </span>
              <span className="text-[11px] text-[#68736E] mt-1 block">Ticket: ₹{lottery.ticketPrice}</span>
            </div>
          )}
        </div>

        {/* Schedule & Metadata Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]">
            <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Draw Day</span>
            <span className="font-bold text-[#17201D] text-sm mt-0.5 block">{lottery.drawDay}</span>
          </div>
          <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]">
            <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Draw Time</span>
            <span className="font-bold text-[#17201D] text-sm mt-0.5 block font-tabular">{lottery.drawTime}</span>
          </div>
          <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]">
            <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Ticket Price</span>
            <span className="font-bold text-[#17201D] text-sm mt-0.5 block font-tabular">₹{lottery.ticketPrice}</span>
          </div>
          <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#E2E7E3]">
            <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Draw Venue</span>
            <span className="font-bold text-[#17201D] text-sm mt-0.5 block truncate">Gorky Bhavan, TVM</span>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/check-ticket?lottery=${lottery.id}`}
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Ticket className="w-4 h-4 text-[#C8A45D]" />
            <span>Check {lottery.name} Ticket</span>
          </Link>
          <Link
            href="/prize-structure"
            className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Prize Breakdown</span>
          </Link>
          <Link
            href="/results/archive"
            className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Past Results Archive</span>
          </Link>
        </div>
      </div>

      {/* Push Notification Card */}
      <NotificationBanner
        lotteryId={lottery.id}
        lotteryName={lottery.name}
      />

      {/* Latest Published Result Section */}
      {latestDraw && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                Most Recent Certified Result
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
                Latest {lottery.name} ({latestDraw.drawNumber}) Result
              </h2>
            </div>
            <OfficialSourceBadge
              sourceUrl={latestDraw.sourceDocumentUrl}
              drawNumber={latestDraw.drawNumber}
              drawDate={format(new Date(latestDraw.drawDate), 'dd MMMM yyyy')}
            />
          </div>

          <PrizeTable
            lotteryName={lottery.name}
            drawNumber={latestDraw.drawNumber}
            prizes={latestDraw.prizes}
          />
        </div>
      )}

      {/* Historical Draws Grid */}
      {pastDraws.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                Draw Archives
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
                Previous {lottery.name} Results
              </h2>
            </div>
            <Link
              href={`/results/archive?lottery=${lottery.slug}`}
              className="text-xs font-bold text-[#0B3B32] hover:text-[#17201D] flex items-center gap-1"
            >
              <span>View All Past Draws</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastDraws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-lg sm:text-xl font-extrabold text-[#17201D]">
            Frequently Asked Questions: {lottery.name}
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#F7F7F4] p-4 sm:p-5 rounded-2xl border border-[#E2E7E3] space-y-1.5">
              <h3 className="font-bold text-[#17201D] text-sm sm:text-base">{faq.question}</h3>
              <p className="text-[#68736E] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related News & Guides */}
      {relatedNews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
            Latest {lottery.name} News & Announcements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {relatedNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
