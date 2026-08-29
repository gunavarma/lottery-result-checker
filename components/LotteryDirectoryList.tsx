'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Clock, Award, ShieldCheck } from 'lucide-react';
import { formatINR } from '@/lib/prisma';

interface LotteryDirectoryListProps {
  lotteries: any[];
}

export function LotteryDirectoryList({ lotteries }: LotteryDirectoryListProps) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kl_favorite_lotteries');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage read errors in private/sandboxed mode
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('kl_favorite_lotteries', JSON.stringify(updated));
    } catch {
      // Ignore localStorage write errors
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm">
      <div className="divide-y divide-[#E2E7E3]">
        {lotteries.map((lottery) => {
          const isFav = favorites.includes(lottery.id);
          const latestDraw = lottery.draws?.[0];
          const topPrize = latestDraw?.prizes?.[0]?.amount;

          return (
            <div
              key={lottery.id}
              className="p-4 sm:p-5 hover:bg-[#F7F7F4] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              {/* Left: Code, Name, Schedule */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(lottery.id, e)}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className={`p-2 rounded-xl border transition-colors shrink-0 ${
                    isFav
                      ? 'bg-[#C8A45D]/15 border-[#C8A45D] text-[#A66A00]'
                      : 'bg-[#F7F7F4] border-[#E2E7E3] text-[#68736E] hover:text-[#17201D]'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-[#C8A45D]' : ''}`} />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
                      {lottery.code}
                    </span>
                    <span className="text-xs text-[#68736E]">
                      Draw Day: <strong className="text-[#17201D]">{lottery.drawDay}</strong>
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#17201D] group-hover:text-[#0B3B32] transition-colors mt-0.5">
                    <Link href={`/lotteries/${lottery.slug}`}>
                      {lottery.name}
                    </Link>
                  </h3>
                </div>
              </div>

              {/* Right: Prize & Action */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E7E3]/60">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#68736E] uppercase font-bold tracking-wide block">
                    1st Prize Outlay
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#16845B] font-tabular">
                    {topPrize ? formatINR(topPrize) : `₹${lottery.ticketPrice === 40 ? '1 Crore' : '10+ Crore'}`}
                  </span>
                </div>

                <Link
                  href={`/lotteries/${lottery.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F7F4] group-hover:bg-[#0B3B32] text-[#17201D] group-hover:text-white text-xs font-bold transition-all border border-[#E2E7E3] group-hover:border-[#0B3B32]"
                >
                  <span>Results</span>
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
