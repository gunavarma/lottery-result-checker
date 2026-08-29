'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { format } from 'date-fns';

interface ResultRowProps {
  draw: any;
  compact?: boolean;
}

export function ResultRow({ draw, compact = false }: ResultRowProps) {
  if (!draw) return null;

  const drawDate = draw.drawDate ? new Date(draw.drawDate) : new Date();
  const dayStr = format(drawDate, 'dd');
  const monthStr = format(drawDate, 'MMM');
  const dayName = format(drawDate, 'EEE');

  const firstPrize = draw.prizes?.find(
    (p: any) => p.tierNumber === 1 || p.orderIndex === 0
  );
  const firstWinner = firstPrize?.winningNumbers?.[0];
  const topPrizeAmount = firstPrize?.amount ? formatINR(firstPrize.amount) : '₹1 Crore';

  const lotterySlug = draw.lottery?.slug || 'kerala-lottery';
  const drawNumberSlug = draw.drawNumber
    ? draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : '';
  const resultUrl = `/results/${lotterySlug}/${drawNumberSlug}`;

  return (
    <div className="px-6 py-4 hover:bg-[#FAFAF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      {/* Left: Date Capsule + Lottery Scheme Info */}
      <div className="flex items-start sm:items-center gap-4">
        {/* Date Capsule */}
        <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl px-3.5 py-2 text-center shrink-0 min-w-[72px]">
          <span className="text-[10px] font-bold uppercase text-[#68736E] block font-tabular">
            {dayName}
          </span>
          <span className="text-sm font-black text-[#17201D] font-tabular block mt-0.5">
            {dayStr} {monthStr}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded-lg border border-[#E2E7E3]">
              {draw.drawNumber}
            </span>
            <span className="text-[11px] text-[#68736E] font-medium">
              {draw.lottery?.drawDay || 'Weekly Draw'}
            </span>
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5">
            <Link href={resultUrl}>
              {draw.lottery?.name} ({draw.drawNumber})
            </Link>
          </h3>
        </div>
      </div>

      {/* Middle: 1st Prize Winner Display */}
      <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E7E3]/60">
        <div className="text-left md:text-right">
          <span className="text-[10px] text-[#68736E] uppercase font-bold tracking-wide block font-tabular">
            1st Prize ({topPrizeAmount})
          </span>
          <span className="text-lg sm:text-xl font-black font-mono tracking-wider text-[#16845B] font-tabular block mt-0.5">
            {firstWinner ? firstWinner.displayNumber : 'Certified'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={resultUrl}
            aria-label={`View full ${draw.lottery?.name} ${draw.drawNumber} results`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
          >
            <span>Full Result</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
