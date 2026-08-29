'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  FileText
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { format, formatDistanceToNow } from 'date-fns';

interface HeroTodayCardProps {
  initialData?: any;
}

export function HeroTodayCard({ initialData }: HeroTodayCardProps) {
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTodayAvailable = data?.isTodayAvailable;
  const liveStatus = data?.liveStatus || 'WAITING';
  const draw = data?.todayDraw || data?.latestDraw;

  // Real-time polling during draw window (3:00 PM - 4:30 PM IST) if not published
  useEffect(() => {
    if (liveStatus === 'PUBLISHED') return;

    const interval = setInterval(async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/results/today', { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
          setData(json);
          setLastChecked(new Date());
        }
      } catch {
        // Silent recovery on polling error
      } finally {
        setLoading(false);
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [liveStatus]);

  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
  const secondPrize = draw?.prizes?.find((p: any) => p.tierNumber === 2 || p.orderIndex === 2);
  const consolationPrize = draw?.prizes?.find((p: any) => p.category?.toLowerCase().includes('cons'));

  const drawDateFormatted = draw?.drawDate
    ? format(new Date(draw.drawDate), 'dd MMMM yyyy')
    : format(new Date(), 'dd MMMM yyyy');
  const drawDateSlug = draw?.drawDate ? format(new Date(draw.drawDate), 'yyyy-MM-dd') : '';

  const getStatusBadge = () => {
    switch (liveStatus) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16845B]/25 text-[#74E3B7] border border-[#16845B]/50 font-tabular">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>RESULT PUBLISHED</span>
          </span>
        );
      case 'CHECKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A66A00]/25 text-[#F2D07C] border border-[#A66A00]/50 font-tabular">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>UPDATING RESULT</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#B54747]/25 text-rose-300 border border-[#B54747]/50 font-tabular">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>TEMPORARILY UNAVAILABLE</span>
          </span>
        );
      case 'WAITING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/15 font-tabular">
            <Clock className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>AWAITING OFFICIAL RESULT (3:00 PM)</span>
          </span>
        );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0B3B32] text-white p-6 sm:p-8 lg:p-10 border border-[#0B3B32] shadow-xl">
      <div className="relative z-10 space-y-6">
        {/* Top Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
              {isTodayAvailable ? "Today's Verified Draw" : 'Latest Published Draw'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {draw?.lottery?.name || 'Kerala State Lottery'}
            </h2>
            <p className="text-xs text-slate-300">
              Synchronized directly from the Directorate of Kerala State Lotteries gazette notifications.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            {getStatusBadge()}
            <span className="text-[11px] text-slate-300/80 font-tabular" suppressHydrationWarning>
              {mounted
                ? `Last synchronized ${formatDistanceToNow(lastChecked, { addSuffix: true })}`
                : 'Synchronized with LOTIS gazette'}
            </span>
          </div>
        </div>

        {/* Informational callout if today's draw is awaiting */}
        {!isTodayAvailable && liveStatus === 'WAITING' && (
          <div className="bg-black/20 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#C8A45D] shrink-0 mt-0.5" />
            <span>
              Today’s result will appear here immediately after official release at 3:00 PM IST. Displaying verified winning numbers from the most recent completed draw below.
            </span>
          </div>
        )}

        {/* Main Result Showcase */}
        {draw ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Draw Identification */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 p-2 flex items-center justify-center shrink-0 border border-white/10">
                  <Image
                    src="/logo.svg"
                    alt="Kerala Lottery"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#C8A45D] tracking-wider uppercase block font-tabular">
                    Draw Code
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight font-tabular">
                    {draw.drawNumber}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wide">
                    Draw Date
                  </span>
                  <span className="font-bold text-white text-sm mt-0.5 block font-tabular">
                    {drawDateFormatted}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wide">
                    Draw Time
                  </span>
                  <span className="font-bold text-white text-sm mt-0.5 block font-tabular">
                    {draw.drawTime || '3:00 PM IST'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#16845B] shrink-0" />
                <span>Directorate of Kerala State Lotteries</span>
              </div>
            </div>

            {/* Right: 1st Prize Showcase & Subordinate Prizes */}
            <div className="lg:col-span-7 bg-[#10201D] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
              {/* 1st Prize Centerpiece */}
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5 font-tabular">
                    <Award className="w-4 h-4 text-[#C8A45D]" />
                    1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                  </span>
                  {firstPrizeWinner?.location && (
                    <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C8A45D]" />
                      <span>{firstPrizeWinner.location}</span>
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <span className="text-3xl sm:text-5xl font-black text-[#C8A45D] font-mono tracking-wider bg-black/40 px-4 py-2.5 rounded-xl border border-[#C8A45D]/30 inline-block font-tabular shadow-inner">
                    {firstPrizeWinner ? firstPrizeWinner.displayNumber : 'Checking...'}
                  </span>
                </div>
              </div>

              {/* 2nd Prize & Consolation Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {secondPrize && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wide">
                      2nd Prize ({formatINR(secondPrize.amount)})
                    </span>
                    <span className="font-mono font-bold text-white text-base mt-1 block font-tabular">
                      {secondPrize.winningNumbers?.[0]?.displayNumber || '—'}
                    </span>
                  </div>
                )}

                {consolationPrize && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wide">
                      Consolation ({formatINR(consolationPrize.amount)})
                    </span>
                    <span className="font-semibold text-slate-200 text-xs mt-1 block font-tabular">
                      {consolationPrize.winningNumbers?.length || 0} Winning Tickets
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/result/${drawDateSlug}/${draw.lottery?.slug || 'kerala-lottery'}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white font-bold text-xs transition-colors group shadow-sm"
                >
                  <span>View Complete Prize Table</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {draw.sourceUrl && (
                  <a
                    href={draw.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-semibold text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C8A45D]" />
                    <span>Official Gazette</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-300 text-sm">
            <p>Loading latest official results from database...</p>
          </div>
        )}
      </div>
    </div>
  );
}
