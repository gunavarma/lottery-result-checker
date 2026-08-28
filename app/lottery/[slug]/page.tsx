import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { PrizeTable } from '@/components/PrizeTable';
import { ResultCard } from '@/components/ResultCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { NotificationBanner } from '@/components/NotificationBanner';
import { Award, Calendar, Clock, Ticket, ShieldCheck, ChevronRight, FileText } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Lottery Results', href: '/previous-results' },
          { label: lottery.name },
        ]}
      />

      {/* Scheme Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md">
                CODE: {lottery.code}
              </span>
              {lottery.isBumper && (
                <span className="font-bold text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-md">
                  BUMPER SCHEME
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lottery.name} Kerala Lottery
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {lottery.description ||
                `Official ${lottery.name} (${lottery.code}) Kerala State Lottery scheme conducted weekly by the Directorate of Kerala State Lotteries.`}
            </p>
          </div>

          {latestDraw?.prizes?.[0] && (
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-center shrink-0 min-w-[200px]">
              <span className="text-xs font-semibold text-emerald-800 uppercase block">1st Prize</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-0.5">
                {formatINR(latestDraw.prizes[0].amount)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Ticket Price: ₹{lottery.ticketPrice}</span>
            </div>
          )}
        </div>

        {/* Schedule & Metadata Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Day</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{lottery.drawDay}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Time</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{lottery.drawTime}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ticket Cost</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{lottery.ticketPrice}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Draw Venue</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">Gorky Bhavan, TVM</span>
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
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Most Recent Draw
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {lottery.name} {latestDraw.drawNumber} Result
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
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

      {/* Previous Results for this scheme */}
      {pastDraws.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Historical Results
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
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
    </div>
  );
}
