import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR, formatINRExact } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Award, ShieldCheck, Ticket, Info, CheckCircle2 } from 'lucide-react';

import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Prize Structure 2026 | Weekly & Bumper Prize Breakdown',
  description:
    'Complete official Kerala Lottery prize structure breakdown for all weekly lotteries (Karunya Plus, Sthree Sakthi, Suvarna Keralam) and bumper lotteries. Prize tiers, winner counts, consolation prizes.',
  path: '/prize-structure',
  keywords: [
    'Kerala Lottery Prize Structure',
    'Kerala Lottery 1st Prize Amount',
    'Kerala Lottery Prize Breakdown',
    'Kerala Lottery Consolation Prize',
    'KeralaDraws',
  ],
});

async function getPrizeStructureData() {
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
              orderBy: { orderIndex: 'asc' },
              include: {
                winningNumbers: true,
              },
            },
          },
        },
      },
    });

    return serializeData(lotteries);
  } catch (error) {
    console.error('Error in getPrizeStructureData:', error);
    return [];
  }
}

export default async function PrizeStructurePage({
  searchParams,
}: {
  searchParams: Promise<{ scheme?: string }>;
}) {
  const params = await searchParams;
  const lotteries = await getPrizeStructureData();
  const selectedSlug = params.scheme || lotteries[0]?.slug;
  const activeLottery = lotteries.find((l: any) => l.slug === selectedSlug) || lotteries[0];
  const latestDraw = activeLottery?.draws?.[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <StructuredData
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Prize Structures', url: '/prize-structure' },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Prize Structures' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Official Government Schemes
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Prize Structures
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Official prize distribution tiers, winner counts, consolation awards, and statutory deductions for all Kerala State Lottery schemes.
        </p>
      </div>

      {/* Scheme Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {lotteries.map((l: any) => {
          const isSelected = l.slug === selectedSlug;
          return (
            <Link
              key={l.id}
              href={`/prize-structure?scheme=${l.slug}`}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs'
                  : 'bg-white border-[#E2E7E3] text-[#17201D] hover:bg-[#F7F7F4]'
              }`}
            >
              {l.name} ({l.code})
            </Link>
          );
        })}
      </div>

      {/* Active Lottery Prize Breakdown Card */}
      {activeLottery && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E7E3] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-3 py-1 rounded-md border border-[#E2E7E3]">
                  CODE: {activeLottery.code}
                </span>
                <span className="text-xs font-semibold text-[#68736E]">
                  Draw Day: <strong className="text-[#17201D]">{activeLottery.drawDay}</strong>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D] mt-2">
                {activeLottery.name} Prize Structure
              </h2>
              <p className="text-xs text-[#68736E] mt-1 max-w-2xl">
                {activeLottery.description ||
                  `Prize distribution hierarchy for ${activeLottery.name} Kerala State Lottery.`}
              </p>
            </div>

            <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-5 text-center shrink-0 min-w-[200px]">
              <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">1st Prize</span>
              <span className="text-3xl font-black text-[#16845B] block mt-0.5 font-tabular">
                {latestDraw?.prizes?.[0] ? formatINR(latestDraw.prizes[0].amount) : '₹1,00,00,000'}
              </span>
              <span className="text-[11px] text-[#68736E] mt-1 block">Ticket Price: ₹{activeLottery.ticketPrice}</span>
            </div>
          </div>

          {/* Prize Breakdown Table */}
          {latestDraw && latestDraw.prizes && latestDraw.prizes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-[#17201D] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0B3B32]" />
                <span>Prize Tiers for {activeLottery.name}</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-[#E2E7E3]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Prize Category</th>
                      <th className="py-3.5 px-4 sm:px-6">Prize Amount</th>
                      <th className="py-3.5 px-4 sm:px-6">Winning Tickets Declared</th>
                      <th className="py-3.5 px-4 sm:px-6">Number Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7E3]">
                    {latestDraw.prizes.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#F7F7F4] transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-[#17201D]">
                          {p.category}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular">
                          {formatINRExact(p.amount)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-[#17201D] font-semibold font-tabular">
                          {p.winningNumbers?.length || 1} {p.winningNumbers?.length === 1 ? 'Winner' : 'Winners'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-xs text-[#68736E]">
                          {p.tierNumber && p.tierNumber <= 3
                            ? 'Series + 6-digit number'
                            : p.category.toLowerCase().includes('cons')
                            ? 'Matching 6-digit in other series'
                            : 'Matching last 4 digits'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#F7F7F4] rounded-2xl p-8 text-center text-[#68736E] text-xs border border-[#E2E7E3]">
              Prize tier structure is loaded upon official synchronization.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
