import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { PrizeTable } from '@/components/PrizeTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { NotificationBanner } from '@/components/NotificationBanner';
import { format, parse, isValid } from 'date-fns';
import { Award, CheckCircle2 } from 'lucide-react';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string; slug: string }>;
}): Promise<Metadata> {
  const { date, slug } = await params;

  let parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedDate)) {
    parsedDate = new Date();
  }
  const dateFormatted = format(parsedDate, 'dd MMMM yyyy');

  const lottery = await prisma.lottery.findUnique({
    where: { slug },
  });

  const lotteryName = lottery?.name || 'Kerala Lottery';

  return {
    title: `${lotteryName} Result ${dateFormatted} | Official Kerala Lottery Winning Numbers`,
    description: `Official Kerala State Lottery result for ${lotteryName} held on ${dateFormatted}. View 1st prize ₹1 Crore ticket, consolation numbers, and ending numbers synchronized from official LOTIS document.`,
    openGraph: {
      title: `${lotteryName} Result ${dateFormatted} | Kerala Lottery`,
      description: `Official ${lotteryName} winning numbers and complete prize structure for ${dateFormatted}.`,
    },
  };
}

async function getDrawData(date: string, slug: string) {
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedDate)) return null;

  const nextDay = new Date(parsedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  let draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: parsedDate,
        lt: nextDay,
      },
      lottery: {
        slug,
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

  if (!draw) {
    draw = await prisma.draw.findFirst({
      where: {
        lottery: {
          slug,
        },
      },
      orderBy: {
        drawDate: 'desc',
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
  }

  return draw ? serializeData(draw) : null;
}

export default async function IndividualDrawResultPage({
  params,
}: {
  params: Promise<{ date: string; slug: string }>;
}) {
  const { date, slug } = await params;
  const draw = await getDrawData(date, slug);

  if (!draw) {
    notFound();
  }

  const drawDateObj = new Date(draw.drawDate);
  const drawDateFormatted = format(drawDateObj, 'dd MMMM yyyy');
  const firstPrize = draw.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Kerala Lottery Result ${draw.lottery?.name} ${draw.drawNumber} on ${drawDateFormatted}`,
    datePublished: draw.publishedAt || draw.drawDate,
    dateModified: draw.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Kerala State Lotteries Directorate',
      url: 'https://statelottery.kerala.gov.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kerala Lottery Results',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://keralalottery.org'}/result/${date}/${slug}`,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Lottery Results', href: '/previous-results' },
          { label: draw.lottery?.name || 'Lottery', href: `/lottery/${draw.lottery?.slug}` },
          { label: `${draw.drawNumber} (${drawDateFormatted})` },
        ]}
      />

      {/* Main Draw Result Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Kerala Lottery Result
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Official Draw</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 tracking-tight">
              {draw.lottery?.name} {draw.drawNumber}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Date</span>
              <span className="font-bold text-slate-900 text-sm">{drawDateFormatted}</span>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{draw.drawNumber}</span>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Result Status</span>
              <span className="font-bold text-emerald-700 text-sm">Published</span>
            </div>
          </div>
        </div>

        {/* 1st Prize Feature Box */}
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
        title={`Kerala Lottery Result — ${draw.lottery?.name} (${draw.drawNumber})`}
        url={`/result/${date}/${slug}`}
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
          <span>Verify Ticket Number</span>
        </Link>
      </div>

      {/* FCM Push Notification Banner */}
      <NotificationBanner
        lotteryId={draw.lotteryId}
        lotteryName={draw.lottery?.name}
      />

      {/* Official Source Transparency Notice */}
      <OfficialSourceBadge
        sourceUrl={draw.sourceUrl}
        drawNumber={draw.drawNumber}
        drawDate={drawDateFormatted}
      />

      {/* Complete Variable Prize Structure Table */}
      <PrizeTable
        prizes={draw.prizes || []}
        lotteryName={draw.lottery?.name}
        drawNumber={draw.drawNumber}
      />
    </div>
  );
}
