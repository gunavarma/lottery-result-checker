import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultShareBar } from '@/components/ResultShareBar';
import { NotificationBanner } from '@/components/NotificationBanner';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Award, Clock, CheckCircle2, Search, MapPin, Ticket, ShieldCheck, FileText, ExternalLink, ArrowRight, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const now = new Date();
  const dateFormatted = format(now, 'dd MMMM yyyy');

  return constructMetadata({
    title: `Kerala Lottery Result Today (${dateFormatted}) | Winning Numbers`,
    description: `Check official Kerala lottery result today (${dateFormatted}). 1st prize winning ticket, consolation numbers, prize structure and LOTIS gazette verification on KeralaDraws.`,
    path: '/kerala-lottery-result-today',
    keywords: [
      'Kerala Lottery Result Today',
      'Kerala Lottery Result',
      'Kerala Lottery Result Today Live',
      'Kerala Lottery Winning Numbers',
      'Kerala Lottery Result Yesterday',
      'KeralaDraws',
    ],
  });
}

import { getOrSetCache } from '@/lib/cache';

async function getTodayResultData() {
  return getOrSetCache(
    'today_result_data',
    async () => {
      try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        let draw = await prisma.draw.findFirst({
          where: {
            drawDate: {
              gte: todayStart,
              lte: todayEnd,
            },
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
        });

        let isFromToday = true;
        if (!draw) {
          isFromToday = false;
          draw = await prisma.draw.findFirst({
            where: { status: 'PUBLISHED' },
            orderBy: { drawDate: 'desc' },
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
          });
        }

        return {
          isFromToday,
          draw: draw ? serializeData(draw) : null,
          dateFormatted: format(now, 'dd MMMM yyyy (EEEE)'),
        };
      } catch (error) {
        console.error('Error in getTodayResultData:', error);
        return {
          isFromToday: false,
          draw: null,
          dateFormatted: format(new Date(), 'dd MMMM yyyy (EEEE)'),
        };
      }
    },
    { ttlMs: 30_000, swrMs: 300_000 }
  );
}

export default async function TodayResultPage() {
  const { isFromToday, draw } = await getTodayResultData();

  const drawDateObj = draw?.drawDate ? new Date(draw.drawDate) : new Date();
  const drawDateFormatted = format(drawDateObj, 'dd MMMM yyyy');
  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: "Today's Result", url: '/kerala-lottery-result-today' },
  ];

  const faqs = [
    {
      question: "What time is today's Kerala lottery result published?",
      answer: "Draw proceedings begin at 3:00 PM IST daily at Gorky Bhavan, Thiruvananthapuram. The official certified gazette is published on LOTIS around 4:30 PM.",
    },
    {
      question: "How do I check my ticket on KeralaDraws?",
      answer: "Enter your 6-digit ticket number or 4-digit ending series in the KeralaDraws Ticket Checker to automatically evaluate winning status across all prize tiers.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: "Today's Result" },
        ]}
      />

      {/* Main Page Title Header */}
      <div className="space-y-2 border-b border-[#E2E7E3] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Official LOTIS Publication
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
              Kerala Lottery Result Today
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/30 font-tabular">
            <CheckCircle2 className="w-4 h-4" />
            <span>RESULT PUBLISHED</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Official winning numbers and complete prize tier breakdown for Kerala State Lotteries draw held today at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {!isFromToday && (
        <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-4 text-xs text-[#17201D] flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#C8A45D] shrink-0" />
          <span>
            Today’s official draw result is scheduled for 3:00 PM IST. Displaying the latest verified official draw result ({drawDateFormatted}) below until the new LOTIS gazette is published.
          </span>
        </div>
      )}

      {draw ? (
        <div className="space-y-8">
          {/* Highlight Summary Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold font-mono bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]">
                    {draw.drawNumber}
                  </span>
                  <span className="text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-md">
                    {draw.lottery?.name}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D]">
                  {draw.lottery?.name} ({draw.drawNumber}) Draw Result
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#68736E] pt-1">
                  <span>Draw Date: <strong className="text-[#17201D] font-tabular">{drawDateFormatted}</strong></span>
                  <span>•</span>
                  <span>Time: <strong className="text-[#17201D] font-tabular">{draw.drawTime || '3:00 PM'}</strong></span>
                </div>
              </div>

              {firstPrize && firstPrizeWinner && (
                <div className="bg-[#F7F7F4] border border-[#E2E7E3] p-5 rounded-2xl text-center shrink-0 min-w-[220px]">
                  <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                    1st Prize ({formatINR(firstPrize.amount)})
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#16845B] block mt-1">
                    {firstPrizeWinner.displayNumber}
                  </span>
                  {firstPrizeWinner.location && (
                    <span className="text-[11px] text-[#68736E] flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[#C8A45D]" />
                      <span>{firstPrizeWinner.location}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`}
                  className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
                >
                  <Ticket className="w-4 h-4 text-[#C8A45D]" />
                  <span>Check Ticket in this Draw</span>
                </Link>
                <Link
                  href={`/lotteries/${draw.lottery.slug}`}
                  className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                >
                  <span>{draw.lottery.name} Hub</span>
                </Link>
              </div>

              <ResultShareBar
                title={`${draw.lottery?.name || 'Kerala Lottery'} (${draw.drawNumber}) Result`}
                url="/kerala-lottery-result-today"
              />
            </div>
          </div>

          {/* Full Prize Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
                Complete Prize Tiers & Winning Numbers
              </h2>
              <OfficialSourceBadge
                sourceUrl={draw.sourceDocumentUrl}
                drawNumber={draw.drawNumber}
                drawDate={drawDateFormatted}
              />
            </div>
            <PrizeTable
              lotteryName={draw.lottery?.name || 'Kerala Lottery'}
              drawNumber={draw.drawNumber}
              prizes={draw.prizes}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#17201D]">Draw In Progress</h3>
            <p className="text-xs text-[#68736E] max-w-md mx-auto">
              Today’s draw results will be updated automatically upon certification by the Directorate of Kerala State Lotteries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
