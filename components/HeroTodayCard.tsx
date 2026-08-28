'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
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
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        setLoading(false);
      }
    }, 45000); // Poll every 45s

    return () => clearInterval(interval);
  }, [liveStatus]);

  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
  const secondPrize = draw?.prizes?.find((p: any) => p.tierNumber === 2 || p.orderIndex === 2);
  const consolationPrize = draw?.prizes?.find((p: any) => p.category?.toLowerCase().includes('cons'));

  const drawDateFormatted = draw?.drawDate ? format(new Date(draw.drawDate), 'dd MMMM yyyy') : format(new Date(), 'dd MMMM yyyy');
  const drawDateSlug = draw?.drawDate ? format(new Date(draw.drawDate), 'yyyy-MM-dd') : '';

  const getStatusBadge = () => {
    switch (liveStatus) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>OFFICIAL RESULT PUBLISHED</span>
          </span>
        );
      case 'CHECKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>CHECKING OFFICIAL SOURCE...</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>TEMPORARILY UNAVAILABLE</span>
          </span>
        );
      case 'WAITING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>WAITING FOR OFFICIAL RESULT (3:00 PM)</span>
          </span>
        );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-slate-700/60">
      {/* Background Subtle Highlights */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Latest Official Draw
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kerala Lottery Results Today
            </h2>
            <p className="text-xs text-slate-300">
              Latest Kerala State Lottery results, draw numbers, winning numbers and prize details.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            {getStatusBadge()}
            <span className="text-[11px] text-slate-400">
              Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* If no today's draw published yet and showing waiting message */}
        {!isTodayAvailable && liveStatus === 'WAITING' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Today's result will appear here after the official result is published by the Directorate of Kerala State Lotteries (Draw time: 3:00 PM IST). Showing the most recent verified result below.
            </span>
          </div>
        )}

        {/* Main Result Card Content */}
        {draw ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Col: Lottery Name & Draw Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-emerald-950/60 bg-emerald-950 shrink-0 border border-emerald-500/20 p-1 flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="Kerala Lottery Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase block">
                    {draw.lottery?.name || 'Kerala State Lottery'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
                    {draw.drawNumber}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Draw Date</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{drawDateFormatted}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Draw Time</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{draw.drawTime || '3:00 PM'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Source: Kerala State Lotteries, Government of Kerala</span>
              </div>
            </div>

            {/* Right Col: Top Winning Numbers Card */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xs space-y-4">
              {/* 1st Prize Showcase */}
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                  </span>
                  {firstPrizeWinner?.location && (
                    <span className="text-[11px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-md font-medium">
                      {firstPrizeWinner.location}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-4xl font-black text-amber-400 tracking-wider font-mono bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-500/40 inline-block shadow-inner">
                    {firstPrizeWinner ? firstPrizeWinner.displayNumber : 'Checking...'}
                  </span>
                </div>
              </div>

              {/* 2nd Prize & Consolation Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {secondPrize && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">
                      2nd Prize ({formatINR(secondPrize.amount)})
                    </span>
                    <span className="font-mono font-bold text-white text-base mt-1 block">
                      {secondPrize.winningNumbers?.[0]?.displayNumber || '—'}
                    </span>
                  </div>
                )}

                {consolationPrize && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">
                      Consolation Prize ({formatINR(consolationPrize.amount)})
                    </span>
                    <span className="font-semibold text-emerald-400 text-xs mt-1 block">
                      {consolationPrize.winningNumbers?.length || 0} Winning Tickets
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/result/${drawDateSlug}/${draw.lottery?.slug || 'kerala-lottery'}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 transition-all group"
                >
                  <span>View Full Prize Table & Numbers</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                {draw.sourceUrl && (
                  <a
                    href={draw.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs transition-colors"
                  >
                    <span>Official PDF</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p>Loading latest official results from database...</p>
          </div>
        )}
      </div>
    </div>
  );
}
