'use client';

import React, { useState } from 'react';
import { Award, Copy, Check, Printer, FileText, MapPin } from 'lucide-react';
import { formatINR, formatINRExact } from '@/lib/prisma';
import { useLanguage } from '@/context/LanguageContext';

interface PrizeTableProps {
  prizes: any[];
  lotteryName?: string;
  drawNumber?: string;
}

export function PrizeTable({ prizes, lotteryName, drawNumber }: PrizeTableProps) {
  const { t } = useLanguage();
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
      <div className="bg-white rounded-2xl p-8 border border-[#E2E7E3] text-center text-[#68736E] text-xs">
        No prize data available for this draw.
      </div>
    );
  }

  const getLocalizedCategory = (category: string, tierNumber?: number) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('cons') || cat.includes('സമാശ്വാസ')) return t('ui.consolation_prize', 'Consolation Prize');
    if (tierNumber === 1 || cat.includes('1st') || cat.includes('ഒന്നാം')) return t('ui.first_prize', '1st Prize');
    if (tierNumber === 2 || cat.includes('2nd') || cat.includes('രണ്ടാം')) return t('ui.second_prize', '2nd Prize');
    if (tierNumber === 3 || cat.includes('3rd') || cat.includes('മൂന്നാം')) return t('ui.third_prize', '3rd Prize');
    if (tierNumber === 4 || cat.includes('4th') || cat.includes('നാലാം')) return t('ui.fourth_prize', '4th Prize');
    if (tierNumber === 5 || cat.includes('5th') || cat.includes('അഞ്ചാം')) return t('ui.fifth_prize', '5th Prize');
    if (tierNumber === 6 || cat.includes('6th') || cat.includes('ആറാം')) return t('ui.sixth_prize', '6th Prize');
    if (tierNumber === 7 || cat.includes('7th') || cat.includes('ഏഴാം')) return t('ui.seventh_prize', '7th Prize');
    if (tierNumber === 8 || cat.includes('8th') || cat.includes('എട്ടാം')) return t('ui.eighth_prize', '8th Prize');
    if (tierNumber === 9 || cat.includes('9th') || cat.includes('ഒൻപതാം')) return t('ui.ninth_prize', '9th Prize');
    return category;
  };

  return (
    <div className="space-y-6">
      {/* Table Header Action Bar */}
      <div className="flex items-center justify-between no-print border-b border-[#E2E7E3] pb-3">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            {t('ui.certified_result', 'Full Gazette Breakdown')}
          </span>
          <h2 className="text-xl font-extrabold text-[#17201D] tracking-tight">
            {t('ui.winning_numbers', 'Official Prize Tiers & Winning Numbers')}
          </h2>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F7F7F4] hover:bg-[#F1F4F2] text-[#17201D] font-bold text-xs transition-colors border border-[#E2E7E3]"
        >
          <Printer className="w-3.5 h-3.5 text-[#68736E]" />
          <span>Print Result</span>
        </button>
      </div>

      {/* Prize Cards Stream */}
      <div className="space-y-4">
        {prizes.map((prize, pIdx) => {
          const isTopTier = prize.tierNumber === 1 || prize.tierNumber === 2 || prize.tierNumber === 3 || prize.orderIndex === 0;
          const isConsolation = prize.category.toLowerCase().includes('cons');

          return (
            <div
              key={prize.id || pIdx}
              className={`rounded-2xl border overflow-hidden transition-shadow ${
                prize.tierNumber === 1 || prize.orderIndex === 0
                  ? 'bg-white border-[#C8A45D]/60 shadow-sm'
                  : isTopTier
                  ? 'bg-white border-[#0B3B32]/30 shadow-xs'
                  : isConsolation
                  ? 'bg-white border-[#E2E7E3]'
                  : 'bg-white border-[#E2E7E3]'
              }`}
            >
              {/* Prize Tier Header */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#E2E7E3] flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F4]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs font-tabular ${
                      prize.tierNumber === 1 || prize.orderIndex === 0
                        ? 'bg-[#C8A45D] text-[#10201D]'
                        : isTopTier
                        ? 'bg-[#0B3B32] text-white'
                        : isConsolation
                        ? 'bg-[#68736E] text-white'
                        : 'bg-[#E2E7E3] text-[#17201D]'
                    }`}
                  >
                    {prize.tierNumber ? `${prize.tierNumber}` : 'C'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#17201D] text-base">
                      {getLocalizedCategory(prize.category, prize.tierNumber)}
                    </h3>
                    {prize.description && (
                      <span className="text-[10px] text-[#68736E] block uppercase font-bold tracking-wide">
                        {prize.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#68736E] block uppercase font-bold tracking-wide">
                    {t('ui.prize_amount', 'Prize Amount')}
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black font-tabular ${
                      prize.tierNumber === 1 || prize.orderIndex === 0
                        ? 'text-[#C8A45D]'
                        : isTopTier
                        ? 'text-[#16845B]'
                        : 'text-[#17201D]'
                    }`}
                  >
                    {formatINRExact(prize.amount)}
                  </span>
                </div>
              </div>

              {/* Winning Numbers Body */}
              <div className="p-5 sm:p-6">
                {isTopTier ? (
                  /* Top Tiers: High-Impact Cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prize.winningNumbers?.map((w: any, wIdx: number) => (
                      <div
                        key={w.id || wIdx}
                        className="bg-[#F7F7F4] rounded-xl p-4 border border-[#E2E7E3] flex items-center justify-between group hover:border-[#0B3B32]/40 transition-colors"
                      >
                        <div>
                          <span className="text-[10px] text-[#68736E] block font-bold uppercase tracking-wide">
                            Winning Ticket
                          </span>
                          <span className="text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular">
                            {w.displayNumber}
                          </span>
                          {w.location && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-white text-[#17201D] px-2 py-0.5 rounded border border-[#E2E7E3] font-semibold">
                              <MapPin className="w-3 h-3 text-[#C8A45D]" />
                              <span>{w.location}</span>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`)}
                          aria-label="Copy ticket number"
                          className="p-2 rounded-lg bg-white hover:bg-[#F1F4F2] text-[#68736E] group-hover:text-[#0B3B32] transition-colors border border-[#E2E7E3]"
                        >
                          {copiedId === `${prize.category}-${wIdx}` ? (
                            <Check className="w-4 h-4 text-[#16845B]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isConsolation ? (
                  /* Consolation Series Grid */
                  <div className="space-y-2">
                    <p className="text-xs text-[#68736E] font-medium">
                      Consolation prize matching remaining series ({prize.winningNumbers?.length || 0} tickets):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {prize.winningNumbers?.map((w: any, wIdx: number) => (
                        <div
                          key={w.id || wIdx}
                          onClick={() => handleCopyNumber(w.displayNumber, `cons-${wIdx}`)}
                          className="bg-[#F7F7F4] hover:bg-[#F1F4F2] cursor-pointer border border-[#E2E7E3] rounded-xl p-2.5 text-center transition-all group"
                        >
                          <span className="font-mono font-bold text-[#17201D] text-sm block font-tabular">
                            {w.displayNumber}
                          </span>
                          <span className="text-[10px] text-[#0B3B32] font-semibold group-hover:underline">
                            {copiedId === `cons-${wIdx}` ? 'Copied' : 'Click to copy'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Lower Ending Digits Grid */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#68736E]">
                      <span>Total Winning Numbers: <strong className="text-[#17201D] font-tabular">{prize.winningNumbers?.length || 0}</strong></span>
                      <span className="text-[11px] text-[#68736E]">Click any number to copy</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {prize.winningNumbers?.map((w: any, wIdx: number) => (
                        <button
                          key={w.id || wIdx}
                          onClick={() => handleCopyNumber(w.displayNumber, `${prize.category}-${wIdx}`)}
                          className={`px-2 py-2 rounded-lg font-mono text-sm font-bold border transition-all text-center font-tabular ${
                            copiedId === `${prize.category}-${wIdx}`
                              ? 'bg-[#0B3B32] text-white border-[#0B3B32]'
                              : 'bg-[#F7F7F4] hover:bg-[#F1F4F2] text-[#17201D] border-[#E2E7E3]'
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
