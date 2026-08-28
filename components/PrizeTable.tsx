'use client';

import React, { useState } from 'react';
import { Award, Copy, Check, Printer, FileText } from 'lucide-react';
import { formatINR, formatINRExact } from '@/lib/prisma';

interface PrizeTableProps {
  prizes: any[];
  lotteryName?: string;
  drawNumber?: string;
}

export function PrizeTable({ prizes, lotteryName, drawNumber }: PrizeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyNumber = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!prizes || prizes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
        No prize data available for this draw.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Header Action Bar */}
      <div className="flex items-center justify-between no-print">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>Official Prize Breakdown & Winning Numbers</span>
        </h3>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Result</span>
        </button>
      </div>

      {/* Prize Cards Stream */}
      <div className="space-y-4">
        {prizes.map((prize, pIdx) => {
          const isTopTier = prize.tierNumber === 1 || prize.tierNumber === 2 || prize.tierNumber === 3;
          const isConsolation = prize.category.toLowerCase().includes('cons');

          return (
            <div
              key={prize.id || pIdx}
              className={`rounded-2xl border overflow-hidden transition-shadow ${
                prize.tierNumber === 1
                  ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-300 shadow-sm'
                  : isTopTier
                  ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300 shadow-2xs'
                  : isConsolation
                  ? 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-white border-purple-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Prize Tier Header */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-inherit flex flex-wrap items-center justify-between gap-3 bg-inherit">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      prize.tierNumber === 1
                        ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                        : isTopTier
                        ? 'bg-emerald-600 text-white'
                        : isConsolation
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {prize.tierNumber ? `${prize.tierNumber}` : 'C'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {prize.category}
                    </h4>
                    {prize.description && (
                      <span className="text-[11px] text-slate-500 block uppercase font-medium">
                        {prize.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                    Prize Amount
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black ${
                      prize.tierNumber === 1
                        ? 'text-amber-600'
                        : isTopTier
                        ? 'text-emerald-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatINRExact(prize.amount)}
                  </span>
                </div>
              </div>

              {/* Winning Numbers Body */}
              <div className="p-5 sm:p-6">
                {isTopTier ? (
                  /* 1st, 2nd, 3rd Prize High-Impact Cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prize.winningNumbers?.map((w: any, wIdx: number) => (
                      <div
                        key={w.id || wIdx}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between group hover:border-emerald-500 transition-colors"
                      >
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            Winning Ticket
                          </span>
                          <span className="text-2xl font-black text-slate-900 font-mono tracking-wider">
                            {w.displayNumber}
                          </span>
                          {w.location && (
                            <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                              📍 {w.location}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`)}
                          aria-label="Copy ticket number"
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 group-hover:text-emerald-600 transition-colors"
                        >
                          {copiedId === `${prize.category}-${wIdx}` ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isConsolation ? (
                  /* Consolation Prize Series Grid */
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium">
                      Consolation prize tickets matching all remaining series ({prize.winningNumbers?.length || 0} tickets):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {prize.winningNumbers?.map((w: any, wIdx: number) => (
                        <div
                          key={w.id || wIdx}
                          onClick={() => handleCopyNumber(w.displayNumber, `cons-${wIdx}`)}
                          className="bg-purple-50/50 hover:bg-purple-100/60 cursor-pointer border border-purple-200/80 rounded-xl p-2.5 text-center transition-all group"
                        >
                          <span className="font-mono font-bold text-slate-900 text-sm block">
                            {w.displayNumber}
                          </span>
                          <span className="text-[10px] text-purple-700 font-semibold group-hover:underline">
                            {copiedId === `cons-${wIdx}` ? 'Copied!' : 'Click to copy'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Lower Prize Ending Numbers Grid */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Total Winning Numbers: <strong>{prize.winningNumbers?.length || 0}</strong></span>
                      <span className="text-[11px] text-slate-400">Click any number to copy</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {prize.winningNumbers?.map((w: any, wIdx: number) => (
                        <button
                          key={w.id || wIdx}
                          onClick={() => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`)}
                          className={`px-2 py-2 rounded-lg font-mono text-sm font-bold border transition-all text-center ${
                            copiedId === `${prize.category}-${wIdx}`
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {w.displayNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
