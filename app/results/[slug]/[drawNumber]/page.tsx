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
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { getRelatedNewsForLottery } from '@/lib/news';
import { NewsCard } from '@/components/NewsComponents';
import { format } from 'date-fns';
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Ticket,
  FileText,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; drawNumber: string }>;
}): Promise<Metadata> {
  try {
    const { slug, drawNumber } = await params;
    const cleanDrawNumber = drawNumber.toUpperCase();

    const lottery = await prisma.lottery.findUnique({
      where: { slug },
    });

    const draw = await prisma.draw.findFirst({
      where: {
        lottery: { slug },
        OR: [
          { drawNumber: cleanDrawNumber },
          { drawNumber: { contains: cleanDrawNumber } },
        ],
      },
      include: {
        prizes: {
          where: { orderIndex: 0 },
          include: { winningNumbers: { take: 1 } },
        },
      },
    });

    const lotteryName = lottery?.name || 'Kerala Lottery';
    const drawDateFormatted = draw ? format(new Date(draw.drawDate), 'dd MMMM yyyy') : '';

    if (!draw) {
      return constructMetadata({
        title: `${lotteryName} (${cleanDrawNumber}) Result`,
        description: `Official Kerala State Lottery result for ${lotteryName} (${cleanDrawNumber}). Complete winning numbers and prize table.`,
        path: `/results/${slug}/${drawNumber.toLowerCase()}`,
      });
    }

    const firstPrizeTicket = draw.prizes?.[0]?.winningNumbers?.[0]?.displayNumber;
    const title = `${lotteryName} ${draw.drawNumber} Result (${drawDateFormatted}) | KeralaDraws`;
    const description = `Check official ${lotteryName} (${draw.drawNumber}) Kerala lottery result held on ${drawDateFormatted}. 1st Prize Winner: ${firstPrizeTicket || 'Certified'}, consolation prizes, and complete winning tiers.`;

    const dateSlug = draw ? draw.drawDate.toISOString().slice(0, 10) : '';

    return constructMetadata({
      title,
      description,
      path: dateSlug ? `/kerala-lottery-result/${dateSlug}` : `/results/${slug}/${drawNumber.toLowerCase()}`,
      keywords: [
        `${lotteryName} result`,
        `${draw.drawNumber} result`,
        `${lotteryName} ${draw.drawNumber}`,
        `${lotteryName} winning numbers`,
        'KeralaDraws',
      ],
    });
  } catch (error) {
    return constructMetadata({
      title: 'Kerala Lottery Result',
      path: '/results',
    });
  }
}

import { getOrSetCache } from '@/lib/cache';

async function getDrawResultData(slug: string, drawNumber: string) {
  const cacheKey = `draw_result_${slug}_${drawNumber.toLowerCase()}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        const cleanDrawNumber = drawNumber.toUpperCase();

        const draw = await prisma.draw.findFirst({
          where: {
            lottery: { slug },
            OR: [
              { drawNumber: cleanDrawNumber },
              { drawNumber: { contains: cleanDrawNumber } },
            ],
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

        if (!draw) return null;

        // Fetch previous and next draws for navigation
        const [previousDraw, nextDraw, relatedDraws] = await Promise.all([
          prisma.draw.findFirst({
            where: {
              lotteryId: draw.lotteryId,
              drawDate: { lt: draw.drawDate },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'desc' },
            select: { id: true, drawNumber: true, drawDate: true, lottery: { select: { slug: true } } },
          }),
          prisma.draw.findFirst({
            where: {
              lotteryId: draw.lotteryId,
              drawDate: { gt: draw.drawDate },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'asc' },
            select: { id: true, drawNumber: true, drawDate: true, lottery: { select: { slug: true } } },
          }),
          prisma.draw.findMany({
            where: {
              lotteryId: draw.lotteryId,
              id: { not: draw.id },
              status: 'PUBLISHED',
            },
            orderBy: { drawDate: 'desc' },
            take: 3,
            select: {
              id: true,
              drawNumber: true,
              drawDate: true,
              lottery: { select: { name: true, slug: true, code: true } },
              prizes: {
                where: { orderIndex: 0 },
                select: { amount: true, winningNumbers: { take: 1, select: { displayNumber: true } } },
              },
            },
          }),
        ]);

        return {
          draw: serializeData(draw),
          previousDraw: previousDraw ? serializeData(previousDraw) : null,
          nextDraw: nextDraw ? serializeData(nextDraw) : null,
          relatedDraws: serializeData(relatedDraws),
        };
      } catch (error) {
        console.error('Error in getDrawResultData:', error);
        return null;
      }
    },
    { ttlMs: 3600_000, swrMs: 86400_000 }
  );
}

export default async function PermanentResultPage({
  params,
}: {
  params: Promise<{ slug: string; drawNumber: string }>;
}) {
  const { slug, drawNumber } = await params;
  const data = await getDrawResultData(slug, drawNumber);

  if (!data || !data.draw) {
    notFound();
  }

  const { draw, previousDraw, nextDraw, relatedDraws } = data;
  const drawDateFormatted = format(new Date(draw.drawDate), 'dd MMMM yyyy');
  const relatedNews = getRelatedNewsForLottery(draw.lottery.slug);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' },
    { name: draw.lottery.name, url: `/lotteries/${draw.lottery.slug}` },
    { name: draw.drawNumber, url: `/results/${draw.lottery.slug}/${draw.drawNumber.toLowerCase()}` },
  ];

  const firstPrize = draw.prizes?.find((p: any) => p.orderIndex === 0);
  const firstWinner = firstPrize?.winningNumbers?.[0];

  const faqs = [
    {
      question: `What is the 1st prize winning number for ${draw.lottery.name} ${draw.drawNumber}?`,
      answer: firstWinner
        ? `The official 1st prize winning ticket for ${draw.lottery.name} (${draw.drawNumber}) held on ${drawDateFormatted} is ${firstWinner.displayNumber} (${formatINR(firstPrize.amount)}).`
        : `Results are certified and published officially on LOTIS.`,
    },
    {
      question: `How do I claim my prize for ${draw.drawNumber}?`,
      answer: `Prizes up to ₹5,000 can be claimed at any authorized lottery shop in Kerala. Prizes between ₹5,000 and ₹1 Lakh must be claimed at District Lottery Offices. Prizes exceeding ₹1 Lakh must be presented to the Directorate of State Lotteries in Thiruvananthapuram or through a nationalized bank within 90 days.`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Results', href: '/results' },
          { label: draw.lottery.name, href: `/lotteries/${draw.lottery.slug}` },
          { label: draw.drawNumber },
        ]}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]">
                {draw.drawNumber}
              </span>
              <span className="font-bold text-xs bg-[#0B3B32] text-white px-3 py-1 rounded-md">
                OFFICIAL RESULT
              </span>
              <OfficialSourceBadge
                sourceUrl={draw.sourceDocumentUrl}
                drawNumber={draw.drawNumber}
                drawDate={drawDateFormatted}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17201D] tracking-tight">
              {draw.lottery.name} ({draw.drawNumber}) Lottery Result
            </h1>
            <p className="text-xs sm:text-sm text-[#68736E]">
              Held on <strong>{drawDateFormatted}</strong> at Gorky Bhavan, Thiruvananthapuram. Synchronized directly with official LOTIS gazette.
            </p>
          </div>

          {firstWinner && (
            <div className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] text-center shrink-0 min-w-[220px]">
              <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                1st Prize ({formatINR(firstPrize.amount)})
              </span>
              <span className="text-2xl font-black font-mono text-[#16845B] block mt-1">
                {firstWinner.displayNumber}
              </span>
              {firstWinner.location && (
                <span className="text-[11px] text-[#68736E] flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-[#C8A45D]" />
                  <span>{firstWinner.location}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/check-ticket?lottery=${draw.lotteryId}&draw=${draw.drawNumber}`}
              className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              <Ticket className="w-4 h-4 text-[#C8A45D]" />
              <span>Verify Ticket in this Draw</span>
            </Link>
            <Link
              href={`/lotteries/${draw.lottery.slug}`}
              className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-3.5 py-2 rounded-xl font-bold text-xs transition-colors"
            >
              <span>{draw.lottery.name} Hub</span>
            </Link>
          </div>

          <ResultShareBar
            title={`${draw.lottery.name} (${draw.drawNumber}) Result`}
            url={`/results/${draw.lottery.slug}/${draw.drawNumber.toLowerCase()}`}
          />
        </div>
      </div>

      {/* Previous / Next Draw Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previousDraw ? (
          <Link
            href={`/results/${previousDraw.lottery.slug}/${previousDraw.drawNumber.toLowerCase()}`}
            className="bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F7F7F4] flex items-center justify-center text-[#0B3B32] group-hover:bg-[#0B3B32] group-hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#68736E] uppercase block font-tabular">Previous Draw</span>
                <span className="text-xs font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors">{previousDraw.drawNumber}</span>
              </div>
            </div>
            <span className="text-[11px] text-[#68736E] font-tabular">{format(new Date(previousDraw.drawDate), 'dd MMM yyyy')}</span>
          </Link>
        ) : (
          <div className="bg-[#F7F7F4]/60 rounded-2xl p-4 border border-[#E2E7E3]/60 text-xs text-[#68736E] flex items-center">
            First recorded draw for this scheme
          </div>
        )}

        {nextDraw ? (
          <Link
            href={`/results/${nextDraw.lottery.slug}/${nextDraw.drawNumber.toLowerCase()}`}
            className="bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-all flex items-center justify-between group shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold text-[#68736E] uppercase block font-tabular">Next Draw</span>
              <span className="text-xs font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors">{nextDraw.drawNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#68736E] font-tabular">{format(new Date(nextDraw.drawDate), 'dd MMM yyyy')}</span>
              <div className="w-8 h-8 rounded-xl bg-[#F7F7F4] flex items-center justify-center text-[#0B3B32] group-hover:bg-[#0B3B32] group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-[#F7F7F4]/60 rounded-2xl p-4 border border-[#E2E7E3]/60 text-xs text-[#68736E] flex items-center justify-end">
            Latest published draw
          </div>
        )}
      </div>

      {/* Full Official Prize Breakdown Table */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
          Official Prize Breakdown & Winning Numbers
        </h2>
        <PrizeTable
          lotteryName={draw.lottery.name}
          drawNumber={draw.drawNumber}
          prizes={draw.prizes}
        />
      </div>

      {/* Push Notification Banner */}
      <NotificationBanner
        lotteryId={draw.lotteryId}
        lotteryName={draw.lottery.name}
      />

      {/* Related Draws */}
      {relatedDraws.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
            More {draw.lottery.name} Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedDraws.map((d: any) => (
              <Link
                key={d.id}
                href={`/results/${d.lottery.slug}/${d.drawNumber.toLowerCase()}`}
                className="bg-white rounded-2xl p-4 border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors space-y-2 block group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#17201D] group-hover:text-[#0B3B32]">{d.drawNumber}</span>
                  <span className="text-[#68736E] font-tabular">{format(new Date(d.drawDate), 'dd MMM yyyy')}</span>
                </div>
                <div className="text-[11px] text-[#68736E] flex items-center justify-between pt-1 border-t border-[#E2E7E3]">
                  <span>1st Prize</span>
                  <span className="font-mono font-bold text-[#16845B]">{d.prizes?.[0]?.winningNumbers?.[0]?.displayNumber || 'Published'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-lg sm:text-xl font-extrabold text-[#17201D]">
            Frequently Asked Questions: {draw.lottery.name} ({draw.drawNumber})
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
            Related News & Gazette Releases
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
