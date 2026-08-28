import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultShareBar } from '@/components/ResultShareBar';
import { NotificationBanner } from '@/components/NotificationBanner';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Award, Clock, CheckCircle2, Search } from 'lucide-react';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const now = new Date();
  const dateFormatted = format(now, 'dd MMMM yyyy');

  return {
    title: `Kerala Lottery Result Today (${dateFormatted}) | Official Live Winning Numbers`,
    description: `Check official Kerala lottery result today (${dateFormatted}). Complete prize structure with 1st prize ₹1 Crore winning ticket, consolation numbers, and ending numbers synchronized with official LOTIS gazette.`,
    openGraph: {
      title: `Kerala Lottery Result Today - ${dateFormatted}`,
      description: `Official Kerala State Lottery result for today. Winning numbers and prize tiers.`,
    },
  };
}

async function getTodayResultData() {
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
  };
}

export default async function TodayResultPage() {
  const { isFromToday, draw } = await getTodayResultData();

  const drawDateObj = draw?.drawDate ? new Date(draw.drawDate) : new Date();
  const drawDateFormatted = format(drawDateObj, 'dd MMMM yyyy');
  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Kerala Lottery Result Today - ${draw?.lottery?.name || 'Kerala Lottery'} ${draw?.drawNumber || ''}`,
    datePublished: draw?.publishedAt || draw?.drawDate || new Date().toISOString(),
    dateModified: draw?.updatedAt || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Kerala Lottery Results',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kerala Lottery Results',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Today's Result" },
        ]}
      />

      {/* Main Page Title Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Official Directorate Publication
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kerala Lottery Result Today
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>RESULT PUBLISHED</span>
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Official winning numbers and complete prize tier breakdown for Kerala State Lotteries draw held today at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {!isFromToday && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Today's official draw result is scheduled for 3:00 PM IST. Displaying the latest verified official draw result ({drawDateFormatted}) below until the new LOTIS result is released.
          </span>
        </div>
      )}

      {draw ? (
        <div className="space-y-8">
          {/* Highlight Summary Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Lottery Scheme
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                  {draw.lottery?.name} ({draw.drawNumber})
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Date</span>
                  <span className="font-bold text-slate-900 text-sm">{drawDateFormatted}</span>
                </div>
                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Time</span>
                  <span className="font-bold text-slate-900 text-sm">{draw.drawTime || '3:00 PM'}</span>
                </div>
              </div>
            </div>

            {/* 1st Prize Hero Display */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-2xl p-6 border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1,00,00,000'})
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-slate-900 font-mono tracking-wider">
                    {firstPrizeWinner ? firstPrizeWinner.displayNumber : '—'}
                  </span>
                </div>
              </div>

              {firstPrizeWinner?.location && (
                <div className="bg-white/90 border border-amber-200 rounded-xl p-3.5 shadow-2xs text-xs space-y-0.5">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold">
                    Winning Agent Location
                  </span>
                  <span className="text-base font-extrabold text-slate-900 block">
                    📍 {firstPrizeWinner.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social Share Bar */}
          <ResultShareBar
            title={`Kerala Lottery Result Today — ${draw.lottery?.name} (${draw.drawNumber})`}
            url="/kerala-lottery-result-today"
          />

          {/* Quick Ticket Check Callout */}
          <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">
                Instant Verification
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                Have a ticket for {draw.drawNumber}?
              </h3>
              <p className="text-xs text-emerald-100 max-w-xl">
                Enter your 6-digit or 4-digit ticket number to immediately check if your ticket won 1st, 2nd, 3rd, or consolation prizes.
              </p>
            </div>

            <Link
              href={`/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`}
              className="px-6 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Verify Ticket Number</span>
            </Link>
          </div>

          {/* FCM Push Notification Banner */}
          <NotificationBanner
            lotteryId={draw.lotteryId}
            lotteryName={draw.lottery?.name}
          />

          {/* Official Verification Badge */}
          <OfficialSourceBadge
            sourceUrl={draw.sourceUrl}
            drawNumber={draw.drawNumber}
            drawDate={drawDateFormatted}
          />

          {/* Full Variable Prize Table */}
          <PrizeTable
            prizes={draw.prizes || []}
            lotteryName={draw.lottery?.name}
            drawNumber={draw.drawNumber}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500">
          <p>No lottery result data available. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
}
