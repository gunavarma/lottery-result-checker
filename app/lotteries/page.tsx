import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Award, Calendar, Clock, Ticket, ShieldCheck, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Schemes Directory | Weekly & Bumper Lotteries',
  description:
    'Explore the complete directory of Kerala State Lottery schemes. Browse weekly lotteries, annual bumper draws, ticket prices, prize structures, draw schedules, and official results.',
  path: '/lotteries',
  keywords: [
    'Kerala Lottery Schemes',
    'Kerala Lottery Directory',
    'Karunya Plus Lottery',
    'Sthree Sakthi Lottery',
    'Suvarna Keralam Lottery',
    'Fifty Fifty Lottery',
    'Nirmal Lottery',
    'Win-Win Lottery',
    'Thiruvonam Bumper',
    'Vishu Bumper',
    'Kerala Lottery Prize List',
  ],
});

async function getLotteriesData() {
  try {
    const lotteries = await prisma.lottery.findMany({
      where: { active: true },
      orderBy: [
        { isBumper: 'asc' },
        { name: 'asc' },
      ],
      include: {
        draws: {
          where: { status: 'PUBLISHED' },
          orderBy: { drawDate: 'desc' },
          take: 1,
          include: {
            prizes: {
              where: { orderIndex: 0 },
              take: 1,
              include: {
                winningNumbers: { take: 1 },
              },
            },
          },
        },
      },
    });

    return serializeData(lotteries);
  } catch (error) {
    console.error('Error in getLotteriesData:', error);
    return [];
  }
}

export default async function LotteriesDirectoryPage() {
  const lotteries = await getLotteriesData();
  const weeklyLotteries = lotteries.filter((l: any) => !l.isBumper);
  const bumperLotteries = lotteries.filter((l: any) => l.isBumper);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Lottery Schemes', url: '/lotteries' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Lottery Directory' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Official Directorate Schemes
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Schemes Directory
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Comprehensive directory of weekly draws and prestigious bumper lotteries conducted by the Directorate of Kerala State Lotteries under the Government of Kerala.
        </p>
      </div>

      {/* Weekly Lotteries Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D]">
              Weekly Lottery Draws
            </h2>
            <p className="text-xs text-[#68736E] mt-0.5">
              Held every day at 3:00 PM IST with daily first prizes starting from ₹1 Crore.
            </p>
          </div>
          <span className="text-xs font-bold text-[#0B3B32] bg-[#F1F4F2] px-3 py-1 rounded-full font-tabular border border-[#0B3B32]/10">
            {weeklyLotteries.length} Active Schemes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {weeklyLotteries.map((lottery: any) => {
            const latestDraw = lottery.draws?.[0];
            const firstPrize = latestDraw?.prizes?.[0];
            const firstWinner = firstPrize?.winningNumbers?.[0];

            return (
              <div
                key={lottery.id}
                className="bg-white rounded-3xl p-6 border border-[#E2E7E3] hover:border-[#0B3B32]/30 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                        Code: {lottery.code} • {lottery.drawDay}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5">
                        {lottery.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] px-2.5 py-1 rounded-xl shrink-0 font-tabular">
                      ₹{lottery.ticketPrice}
                    </span>
                  </div>

                  <p className="text-xs text-[#68736E] line-clamp-2">
                    {lottery.description || `Official ${lottery.name} (${lottery.code}) Kerala lottery results, draw timetable, and winning number breakdowns.`}
                  </p>

                  {latestDraw && (
                    <div className="bg-[#F7F7F4] p-3.5 rounded-2xl border border-[#E2E7E3] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#68736E]">
                        <span>Latest: {latestDraw.drawNumber}</span>
                        <span className="font-tabular font-medium">{new Date(latestDraw.drawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {firstWinner && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#E2E7E3]/60">
                          <span className="text-[10px] font-bold text-[#0B3B32] uppercase">1st Prize Winner</span>
                          <span className="text-xs font-bold font-mono text-[#17201D]">{firstWinner.displayNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E7E3] flex items-center justify-between">
                  <Link
                    href={`/lotteries/${lottery.slug}`}
                    className="text-xs font-bold text-[#0B3B32] hover:text-[#17201D] inline-flex items-center gap-1 group-hover:underline"
                  >
                    <span>View Scheme & Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/check-ticket?lottery=${lottery.id}`}
                    className="text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32] transition-colors"
                  >
                    Check Ticket
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bumper Lotteries Section */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C8A45D]" />
              <span>Seasonal Bumper Lotteries</span>
            </h2>
            <p className="text-xs text-[#68736E] mt-0.5">
              High-jackpot bumper lotteries including Thiruvonam Bumper (₹25 Cr), Vishu, Pooja, Monsoon, and Xmas New Year.
            </p>
          </div>
          <span className="text-xs font-bold text-[#A66A00] bg-[#FFF8E7] px-3 py-1 rounded-full font-tabular border border-[#C8A45D]/30">
            ₹10 Cr to ₹25 Cr
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bumperLotteries.map((lottery: any) => (
            <div
              key={lottery.id}
              className="bg-white rounded-3xl p-6 border-2 border-[#C8A45D]/40 hover:border-[#C8A45D] transition-all shadow-xs hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-[#0B3B32] text-[#C8A45D] text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl font-tabular">
                Bumper Jackpot
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
                    Code: {lottery.code} • Seasonal Draw
                  </span>
                  <h3 className="text-lg font-extrabold text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5">
                    {lottery.name}
                  </h3>
                </div>

                <p className="text-xs text-[#68736E] line-clamp-2">
                  {lottery.description || `Official ${lottery.name} seasonal bumper lottery result, high-value jackpot tiers, and gazette announcement.`}
                </p>

                <div className="bg-[#FFF8E7] p-3.5 rounded-2xl border border-[#C8A45D]/30 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#A66A00]">Ticket Price</span>
                  <span className="font-bold text-[#17201D] font-tabular">₹{lottery.ticketPrice}</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-[#E2E7E3] flex items-center justify-between">
                <Link
                  href={`/lotteries/${lottery.slug}`}
                  className="text-xs font-bold text-[#0B3B32] hover:text-[#17201D] inline-flex items-center gap-1 group-hover:underline"
                >
                  <span>Explore Bumper Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/prize-structure"
                  className="text-[11px] font-bold text-[#68736E] hover:text-[#0B3B32]"
                >
                  Prize Structure
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
