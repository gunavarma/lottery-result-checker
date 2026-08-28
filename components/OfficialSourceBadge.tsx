import React from 'react';
import { ShieldCheck, ExternalLink, FileText } from 'lucide-react';

interface OfficialSourceBadgeProps {
  sourceUrl?: string | null;
  drawNumber?: string;
  drawDate?: string;
  className?: string;
}

export function OfficialSourceBadge({
  sourceUrl,
  drawNumber,
  drawDate,
  className = '',
}: OfficialSourceBadgeProps) {
  const officialUrl = sourceUrl || 'https://www.lotteryagent.kerala.gov.in/result/public';

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <span className="font-semibold text-emerald-950 block">
            Result source: Kerala State Lotteries, Government of Kerala
          </span>
          <span className="text-slate-600 text-[11px] block mt-0.5">
            Verified official draw document for {drawNumber || 'Kerala State Lottery'}
          </span>
        </div>
      </div>

      <a
        href={officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold shadow-2xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-xs shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>View Official Source</span>
        <ExternalLink className="w-3 h-3 ml-0.5" />
      </a>
    </div>
  );
}
