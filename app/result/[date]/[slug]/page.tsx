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
import { getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { format, parse, isValid } from 'date-fns';
import {
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Ticket,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string; slug: string }>;
}): Promise<Metadata> {
  try {
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
      title: `${lotteryName} Result ${dateFormatted} | Official Winning Numbers`,
      description: `Official Kerala State Lottery result for ${lotteryName} held on ${dateFormatted}. View 1st prize winning ticket number, consolation series, and prize table synchronized from LOTIS.`,
      openGraph: {
        title: `${lotteryName} Result ${dateFormatted} | Kerala Lottery`,
        description: `Official ${lotteryName} winning numbers and complete prize structure for ${dateFormatted}.`,
      },
    };
  } catch (error) {
    return {
      title: 'Kerala Lottery Result',
    };
  }
}

async function getDrawData(date: string, slug: string) {
  try {
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
  } catch (error) {
    console.error('Error in getDrawData:', error);
    return null;
  }
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

  const relatedNews = getRelatedNewsForLottery(draw.lottery?.slug || '');

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
          { label: 'Home', href: '/' },
          { label: 'Results Archive', href: '/previous-results' },
          { label: draw.lottery?.name || 'Lottery', href: `/lottery/${draw.lottery?.slug}` },
          { label: `${draw.drawNumber} (${drawDateFormatted})` },
        ]}
      />

      {/* Main Draw Result Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                Kerala Lottery Official Result
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#16845B]/10 text-[#16845B] px-2 py-0.5 rounded font-tabular">
                <CheckCircle2 className="w-3 h-3" />
                <span>Result Published</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
              {draw.lottery?.name} {draw.drawNumber}
            </h1>
            <p className="text-xs text-[#68736E]">
              Draw Date: {drawDateFormatted} • Official LOTIS Synchronized Publication
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#F7F7F4] px-4 py-2.5 rounded-xl border border-[#E2E7E3]">
              <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Draw Date</span>
              <span className="font-bold text-[#17201D] text-sm font-tabular">{drawDateFormatted}</span>
            </div>
            <div className="bg-[#F7F7F4] px-4 py-2.5 rounded-xl border border-[#E2E7E3]">
              <span className="text-[#68736E] block text-[10px] uppercase font-bold tracking-wide">Draw Number</span>
              <span className="font-mono font-bold text-[#17201D] text-sm font-tabular">{draw.drawNumber}</span>
            </div>
            {draw.sourceUrl && (
              <a
                href={draw.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold transition-colors"
              >
                <FileText className="w-4 h-4 text-[#C8A45D]" />
                <span>Official PDF Gazette</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* 1st Prize Feature Box */}
        <div className="bg-[#10201D] text-white rounded-2xl p-6 sm:p-8 border border-[#0B3B32]/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5 font-tabular">
              <Award className="w-4 h-4 text-[#C8A45D]" />
              1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-5xl font-black text-[#C8A45D] font-mono tracking-wider font-tabular bg-black/40 px-4 py-2 rounded-xl border border-[#C8A45D]/30 inline-block shadow-inner">
                {firstPrizeWinner ? firstPrizeWinner.displayNumber : '—'}
              </span>
            </div>
          </div>

          {firstPrizeWinner?.location && (
            <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-xs space-y-1">
              <span className="text-slate-300 block uppercase text-[10px] font-bold tracking-wide">
                Winning Agent District
              </span>
              <span className="text-base font-extrabold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C8A45D]" />
                <span>{firstPrizeWinner.location}</span>
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

      {/* Quick Ticket Verification Callout */}
      <div className="bg-[#0B3B32] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md border border-[#0B3B32]">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
            Instant Verification
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Have a ticket for {draw.drawNumber}?
          </h3>
          <p className="text-xs text-slate-200 max-w-xl">
            Enter your 6-digit or 4-digit ticket number to immediately check if your ticket won 1st, 2nd, 3rd, or consolation prizes.
          </p>
        </div>

        <Link
          href={`/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`}
          className="px-6 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 font-tabular shadow-sm"
        >
          <Ticket className="w-4 h-4 text-[#C8A45D]" />
          <span>Verify Ticket Number</span>
        </Link>
      </div>

      {/* Notification Prompt */}
      <NotificationBanner
        lotteryId={draw.lotteryId}
        lotteryName={draw.lottery?.name}
      />

      {/* Official Source Badge */}
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

      {/* Content Navigation Loop: Related News & Exploration */}
      <div className="pt-8 border-t border-[#E2E7E3] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Explore More
            </span>
            <h3 className="text-xl font-extrabold text-[#17201D]">
              Related Lottery Dispatches & Information
            </h3>
          </div>
          <Link
            href={`/lottery/${draw.lottery?.slug}`}
            className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
          >
            <span>{draw.lottery?.name} All Draws</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedNews.slice(0, 2).map((art) => (
            <NewsCard key={art.id} article={art} />
          ))}
        </div>
      </div>
    </div>
  );
}
