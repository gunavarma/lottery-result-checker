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
import { getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { Award, Calendar, Clock, Ticket, ShieldCheck, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lottery = await prisma.lottery.findUnique({
    where: { slug },
  });

  if (!lottery) {
    return {
      title: 'Kerala Lottery Scheme Not Found',
    };
  }

  return {
    title: `${lottery.name} Result Today | Kerala Lottery Result ${lottery.code}`,
    description: `Get official ${lottery.name} (${lottery.code}) Kerala lottery results, draw schedule (${lottery.drawDay}), winning numbers and historical results archive.`,
    openGraph: {
      title: `${lottery.name} Result Today | Kerala Lottery Result`,
      description: `Official ${lottery.name} (${lottery.code}) results, prize structure, and winning numbers.`,
    },
  };
}

async function getLotterySchemeData(slug: string) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Results Archive', href: '/previous-results' },
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
              {lottery.name} Kerala Lottery
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
      </div>

      {/* FCM Result Notification Banner */}
      <NotificationBanner
        lotteryId={lottery.id}
        lotteryName={lottery.name}
      />

      {/* Latest Draw Result Section */}
      {latestDraw && (
        <section className="space-y-6">
          <div className="border-b border-[#E2E7E3] pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                Most Recent Verified Draw
              </span>
              <h2 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
                {lottery.name} {latestDraw.drawNumber} Result
              </h2>
            </div>
            <span className="text-xs text-[#68736E] font-medium font-tabular">
              Draw Date: {latestDraw.drawDate ? format(new Date(latestDraw.drawDate), 'dd MMM yyyy') : ''}
            </span>
          </div>

          <OfficialSourceBadge
            sourceUrl={latestDraw.sourceUrl}
            drawNumber={latestDraw.drawNumber}
          />

          <PrizeTable
            prizes={latestDraw.prizes || []}
            lotteryName={lottery.name}
            drawNumber={latestDraw.drawNumber}
          />
        </section>
      )}

      {/* Historical Results for this scheme */}
      {pastDraws.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="border-b border-[#E2E7E3] pb-4">
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Historical Draws
            </span>
            <h2 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
              Previous {lottery.name} Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastDraws.map((draw: any) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>
        </section>
      )}

      {/* Related News Dispatches */}
      {relatedNews.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[#E2E7E3]">
          <div className="border-b border-[#E2E7E3] pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                Scheme Coverage
              </span>
              <h2 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
                Related Articles & Dispatches
              </h2>
            </div>
            <Link
              href="/news"
              className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
            >
              <span>All News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedNews.map(a => (
              <NewsCard key={a.id} article={a} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
