import React from 'react';
import Link from 'next/link';
import { Award, Calendar, ArrowRight, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { format } from 'date-fns';

interface ResultCardProps {
  draw: any;
}

export function ResultCard({ draw }: ResultCardProps) {
  const firstPrize = draw.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];

  const drawDateFormatted = draw.drawDate
    ? format(new Date(draw.drawDate), 'dd MMMM yyyy')
    : '';
  const lotterySlug = draw.lottery?.slug || 'kerala-lottery';
  const drawNumberSlug = draw.drawNumber ? draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const resultUrl = `/results/${lotterySlug}/${drawNumberSlug}`;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E7E3] hover:border-[#0B3B32]/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E7E3] pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
              {draw.drawNumber}
            </span>
            <h3 className="text-lg font-extrabold text-[#17201D] mt-1 group-hover:text-[#0B3B32] transition-colors leading-tight">
              <Link href={resultUrl}>
                {draw.lottery?.name}
              </Link>
            </h3>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16845B] bg-[#16845B]/10 px-2 py-0.5 rounded-full font-tabular">
            <CheckCircle2 className="w-3 h-3" />
            <span>Published</span>
          </span>
        </div>

        {/* Date & Draw Info */}
        <div className="flex items-center justify-between text-xs text-[#68736E]">
          <span className="flex items-center gap-1 font-tabular">
            <Calendar className="w-3.5 h-3.5 text-[#68736E]" />
            <span>{drawDateFormatted}</span>
          </span>
          <span className="font-tabular font-medium">{draw.drawTime || '3:00 PM'}</span>
        </div>

        {/* 1st Prize Box */}
        <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#0B3B32] uppercase tracking-wide font-tabular">
              1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
            </span>
            {firstPrizeWinner?.location && (
              <span className="text-[10px] text-[#68736E] font-medium flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-[#C8A45D]" />
                <span>{firstPrizeWinner.location}</span>
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular">
            {firstPrizeWinner ? firstPrizeWinner.displayNumber : '—'}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 mt-4 border-t border-[#E2E7E3] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#68736E]">Official LOTIS Record</span>
        <Link
          href={resultUrl}
          className="font-bold text-[#0B3B32] group-hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
        >
          <span>Complete Result</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
