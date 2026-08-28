import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Award, Calendar, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/prisma';

interface ResultCardProps {
  draw: any;
}

export function ResultCard({ draw }: ResultCardProps) {
  const lottery = draw.lottery || {};
  const drawDateObj = draw.drawDate ? new Date(draw.drawDate) : new Date();
  const dateFormatted = format(drawDateObj, 'dd MMM yyyy');
  const dateSlug = format(drawDateObj, 'yyyy-MM-dd');
  const lotterySlug = lottery.slug || 'kerala-lottery';

  const firstPrize = draw.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/lottery/${lotterySlug}`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-wider block"
            >
              {lottery.name || 'Kerala State Lottery'}
            </Link>
            <h4 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {draw.drawNumber}
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Published</span>
          </span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateFormatted}</span>
          </div>
          <span>•</span>
          <span>{draw.drawTime || '3:00 PM'}</span>
        </div>

        {/* 1st Prize Highlight */}
        <div className="bg-gradient-to-r from-amber-50/80 to-amber-100/40 p-3.5 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>1st Prize</span>
            <span className="text-amber-700 font-bold">
              {firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-900 font-mono tracking-wider">
              {firstPrizeWinner ? firstPrizeWinner.displayNumber : '—'}
            </span>
            {firstPrizeWinner?.location && (
              <span className="text-[10px] text-amber-800 font-medium bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                {firstPrizeWinner.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Links */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/result/${dateSlug}/${lotterySlug}`}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Complete Result</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {draw.sourceUrl && (
          <a
            href={draw.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Official PDF</span>
          </a>
        )}
      </div>
    </div>
  );
}
