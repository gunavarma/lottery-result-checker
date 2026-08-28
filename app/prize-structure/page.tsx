import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR, formatINRExact } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Award, ShieldCheck, Ticket, Info, CheckCircle2 } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Kerala Lottery Prize Structure 2026 | Weekly & Bumper Prize Breakdown',
  description:
    'Complete official Kerala Lottery prize structure breakdown for all weekly lotteries (Karunya Plus, Sthree Sakthi, Suvarna Keralam) and bumper lotteries. Prize tiers, winner counts, consolation prizes.',
};

async function getPrizeStructureData() {
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
      <Breadcrumbs items={[{ label: 'Prize Structure' }]} />

      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Official Government Schemes
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Kerala State Lottery Prize Structures
        </h1>
        <p className="text-sm text-slate-600">
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {l.name} ({l.code})
            </Link>
          );
        })}
      </div>

      {/* Active Lottery Prize Breakdown Card */}
      {activeLottery && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md">
                  CODE: {activeLottery.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Draw Day: <strong>{activeLottery.drawDay}</strong>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {activeLottery.name} Prize Structure
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {activeLottery.description ||
                  `Prize distribution hierarchy for ${activeLottery.name} Kerala State Lottery.`}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shrink-0 min-w-[200px]">
              <span className="text-xs font-semibold text-emerald-800 uppercase block">1st Prize</span>
              <span className="text-3xl font-black text-emerald-700 block mt-0.5">
                {latestDraw?.prizes?.[0] ? formatINR(latestDraw.prizes[0].amount) : '₹1,00,00,000'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Ticket Price: ₹{activeLottery.ticketPrice}</span>
            </div>
          </div>

          {/* Prize Breakdown Table */}
          {latestDraw && latestDraw.prizes && latestDraw.prizes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Prize Tiers for {activeLottery.name}</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Prize Category</th>
                      <th className="py-3.5 px-4 sm:px-6">Prize Amount</th>
                      <th className="py-3.5 px-4 sm:px-6">Winning Tickets Declared</th>
                      <th className="py-3.5 px-4 sm:px-6">Number Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestDraw.prizes.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                          {p.category}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-extrabold text-emerald-700">
                          {formatINRExact(p.amount)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-700 font-semibold">
                          {p.winningNumbers?.length || 1} {p.winningNumbers?.length === 1 ? 'Winner' : 'Winners'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-xs text-slate-500">
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
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-sm">
              Prize tier structure is loaded upon official synchronization.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
