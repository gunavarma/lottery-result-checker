'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { format } from 'date-fns';
import { WinningNumber } from './WinningNumber';

interface ResultRowProps {
  draw: any;
  compact?: boolean;
}

export function ResultRow({ draw, compact = false }: ResultRowProps) {
  if (!draw) return null;

  const drawDate = draw.drawDate ? new Date(draw.drawDate) : new Date();
  const dayStr = format(drawDate, 'dd');
  const monthStr = format(drawDate, 'MMM').toUpperCase();
  const yearStr = format(drawDate, 'yyyy');

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
    <div className="group border-b border-[#E1E6E1] hover:bg-[#F4F3EE]/70 transition-colors py-3.5 sm:py-4 px-3 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        {/* Left: Date + Lottery Scheme & Draw Code */}
        <div className="flex items-center gap-4 min-w-[240px]">
          {/* Minimalist Date Block */}
          <div className="text-center w-12 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#646E68] block font-tabular">
              {monthStr}
            </span>
            <span className="text-xl font-black text-[#141716] block leading-tight font-tabular">
              {dayStr}
            </span>
          </div>

          <div className="w-[1px] h-8 bg-[#E1E6E1] shrink-0" />

          {/* Scheme & Code */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#0A3828] uppercase">
                {draw.drawNumber}
              </span>
              <span className="text-[10px] text-[#646E68] uppercase font-bold tracking-wide">
                • {draw.lottery?.drawDay || 'Daily'}
              </span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#141716] group-hover:text-[#0A3828] transition-colors mt-0.5">
              <Link href={resultUrl} className="focus:outline-none">
                {draw.lottery?.name}
              </Link>
            </h3>
          </div>
        </div>

        {/* Center: Dominant 1st Prize Winning Number */}
        <div className="flex items-center justify-between md:justify-center gap-4 py-1 md:py-0 border-t border-b md:border-t-0 md:border-b-0 border-[#ECEFEA]">
          <span className="text-[10px] uppercase tracking-wider text-[#646E68] font-bold md:hidden">
            1st Prize
          </span>
          <WinningNumber
            number={firstWinner?.displayNumber}
            size="md"
            theme="light"
            className="text-[#141716]"
          />
        </div>

        {/* Right: Prize Outlay & View Link */}
        <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
          <div className="text-left md:text-right">
            <span className="text-[10px] text-[#646E68] uppercase font-bold tracking-wider block font-tabular">
              1st Prize Outlay
            </span>
            <span className="text-sm sm:text-base font-black text-[#C59B27] font-tabular block leading-tight">
              {topPrizeAmount}
            </span>
          </div>

          <Link
            href={resultUrl}
            aria-label={`View full ${draw.lottery?.name} ${draw.drawNumber} results`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0A3828] hover:text-[#134D37] border-b border-[#0A3828]/40 hover:border-[#0A3828] pb-0.5 transition-colors shrink-0"
          >
            <span>Result</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
