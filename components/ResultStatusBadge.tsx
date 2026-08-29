'use client';

import React from 'react';
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResultStatusBadgeProps {
  status: 'PUBLISHED' | 'CHECKING' | 'WAITING' | 'FAILED';
  timeText?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md';
}

export function ResultStatusBadge({
  status,
  timeText,
  theme = 'dark',
  size = 'md',
}: ResultStatusBadgeProps) {
  const isSm = size === 'sm';

  switch (status) {
    case 'PUBLISHED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider font-tabular ${
            isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } rounded-none border ${
            theme === 'dark'
              ? 'bg-[#127A52]/20 text-[#6CE5B4] border-[#127A52]/40'
              : 'bg-[#127A52]/10 text-[#0A3828] border-[#127A52]/30'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#6CE5B4] animate-pulse" />
          <span>RESULT PUBLISHED</span>
          {timeText && <span className="opacity-80 font-normal ml-1">({timeText})</span>}
        </span>
      );

    case 'CHECKING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider font-tabular ${
            isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } rounded-none border ${
            theme === 'dark'
              ? 'bg-[#C59B27]/20 text-[#F2CF66] border-[#C59B27]/40'
              : 'bg-[#C59B27]/15 text-[#8F6D14] border-[#C59B27]/30'
          }`}
        >
          <RefreshCw className="w-3 h-3 animate-spin text-[#F2CF66]" />
          <span>CHECKING RESULT</span>
        </span>
      );

    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider font-tabular ${
            isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } rounded-none border ${
            theme === 'dark'
              ? 'bg-rose-950/30 text-rose-300 border-rose-800/40'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>PENDING GAZETTE</span>
        </span>
      );

    case 'WAITING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider font-tabular ${
            isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } rounded-none border ${
            theme === 'dark'
              ? 'bg-white/10 text-slate-300 border-white/15'
              : 'bg-[#F4F3EE] text-[#646E68] border-[#E1E6E1]'
          }`}
        >
          <Clock className="w-3 h-3 text-[#C59B27]" />
          <span>DRAW TODAY • 3:00 PM IST</span>
        </span>
      );
  }
}
