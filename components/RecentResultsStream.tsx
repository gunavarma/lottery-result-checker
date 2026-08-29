'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Award, ArrowRight, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/prisma';

interface RecentResultsStreamProps {
  draws: any[];
}

export function RecentResultsStream({ draws }: RecentResultsStreamProps) {
  if (!draws || draws.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E7E3] text-center text-[#5F6B66] text-xs">
        Results are synchronizing with the official LOTIS gazette database.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E7E3] overflow-hidden shadow-xs">
      <div className="divide-y divide-[#E2E7E3]">
        {draws.map((draw) => {
          const drawDateFormatted = draw.drawDate
            ? format(new Date(draw.drawDate), 'dd MMM yyyy')
            : '—';
          const drawDateFull = draw.drawDate
            ? format(new Date(draw.drawDate), 'yyyy-MM-dd')
            : '';
          const dayName = draw.drawDate
            ? format(new Date(draw.drawDate), 'EEE')
            : '';

          const firstPrize = draw.prizes?.find(
            (p: any) => p.tierNumber === 1 || p.orderIndex === 0
          );
          const firstWinner = firstPrize?.winningNumbers?.[0];
          const topPrizeAmount = firstPrize?.amount ? formatINR(firstPrize.amount) : '₹1 Crore';

          return (
            <div
              key={draw.id}
              className="p-4 sm:p-5 hover:bg-[#FAFAF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left: Date Badge + Lottery Info */}
              <div className="flex items-start sm:items-center gap-4">
                {/* Date Capsule */}
                <div className="bg-[#F4F5F2] border border-[#E2E7E3] rounded-xl px-3 py-2 text-center shrink-0 min-w-[72px]">
                  <span className="text-[10px] font-bold uppercase text-[#5F6B66] block font-tabular">
                    {dayName}
                  </span>
                  <span className="text-xs font-black text-[#17201D] font-tabular block">
                    {drawDateFormatted.split(' ')[0]} {drawDateFormatted.split(' ')[1]}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#F4F5F2] text-[#0B5D45] px-2 py-0.5 rounded border border-[#E2E7E3]">
                      {draw.drawNumber}
                    </span>
                    <span className="text-[11px] text-[#5F6B66]">
                      {draw.lottery?.name}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B5D45] transition-colors mt-0.5">
                    <Link
                      href={`/results/${draw.lottery?.slug}/${draw.drawNumber.toLowerCase()}`}
                      aria-label={`View ${draw.lottery?.name} ${draw.drawNumber} Result`}
                    >
                      {draw.lottery?.name} ({draw.drawNumber})
                    </Link>
                  </h3>
                </div>
              </div>

              {/* Middle: 1st Prize Winner Display */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E7E3]/60">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[#5F6B66] uppercase font-bold tracking-wide block">
                    1st Prize ({topPrizeAmount})
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono tracking-wider text-[#0B5D45] font-tabular block mt-0.5">
                    {firstWinner ? firstWinner.displayNumber : 'Certified'}
                  </span>
                </div>

                {/* Right: View Action */}
                <Link
                  href={`/results/${draw.lottery?.slug}/${draw.drawNumber.toLowerCase()}`}
                  aria-label={`View complete prize table for ${draw.lottery?.name} ${draw.drawNumber}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4F5F2] group-hover:bg-[#0B5D45] text-[#17201D] group-hover:text-white text-xs font-bold transition-all border border-[#E2E7E3] group-hover:border-[#0B5D45] shrink-0"
                >
                  <span>Full Result</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
