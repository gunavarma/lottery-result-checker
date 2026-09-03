'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  FileText,
  Timer,
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { format } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';
import { useLotteryResults } from '@/hooks/queries/useLotteryResults';
import { SyncIndicator } from '@/components/SyncIndicator';

interface HeroTodayCardProps {
  initialData?: any;
}

export function HeroTodayCard({ initialData }: HeroTodayCardProps) {
  const { t } = useLanguage();
  const { data: queryData, isFetching, error } = useLotteryResults({ initialData });
  const data = queryData || initialData;
  const errorMsg = error ? 'Temporarily unable to connect to results feed.' : null;

  // Time remaining in seconds until 3:00:00 PM IST
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return typeof initialData?.secondsUntilDraw === 'number' ? initialData.secondsUntilDraw : 0;
  });

  const isTodayAvailable = data?.isTodayAvailable;
  const liveStatus = data?.liveStatus || 'WAITING';
  const draw = data?.todayDraw;
  const scheduledLottery = data?.scheduledLottery || draw?.lottery;
  const latestDraw = data?.latestDraw;

  // Sync secondsLeft when fresh queryData arrives
  useEffect(() => {
    if (typeof queryData?.secondsUntilDraw === 'number') {
      setSecondsLeft(queryData.secondsUntilDraw);
    }
  }, [queryData?.secondsUntilDraw]);

  // 1. SECOND-BY-SECOND COUNTDOWN TIMER (IST Based)
  useEffect(() => {
    if (isTodayAvailable || liveStatus === 'PUBLISHED') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTodayAvailable, liveStatus]);

  // Format countdown into Hours, Minutes, Seconds
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const padZero = (n: number) => String(n).padStart(2, '0');

  // Prize details for published result
  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstPrizeWinner = firstPrize?.winningNumbers?.[0];
  const secondPrize = draw?.prizes?.find((p: any) => p.tierNumber === 2 || p.orderIndex === 2);
  const consolationPrize = draw?.prizes?.find((p: any) => p.category?.toLowerCase().includes('cons'));

  const drawDateFormatted = draw?.drawDate
    ? format(new Date(draw.drawDate), 'dd MMMM yyyy')
    : data?.todayDateFormatted || format(new Date(), 'dd MMMM yyyy');

  const drawDateSlug = draw?.drawDate ? format(new Date(draw.drawDate), 'yyyy-MM-dd') : data?.todayDate || '';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0B3B32] text-white p-6 sm:p-8 lg:p-10 border border-[#0B3B32] shadow-xl font-tabular">
      <div className="relative z-10 space-y-6">
        {/* Top Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
                {isTodayAvailable ? "TODAY'S VERIFIED RESULT" : "TODAY'S SCHEDULED DRAW"}
              </span>
              <SyncIndicator isFetching={isFetching} compact className="text-white bg-white/10 border-white/20" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {scheduledLottery?.name || 'Kerala State Lottery'}
            </h2>
            <p className="text-xs text-slate-300">
              Conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            {isTodayAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16845B]/25 text-[#74E3B7] border border-[#16845B]/50 font-tabular">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>RESULT PUBLISHED</span>
              </span>
            ) : secondsLeft > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/15 font-tabular">
                <Clock className="w-3.5 h-3.5 text-[#C8A45D]" />
                <span>RESULT EXPECTED AT 03:00:00 PM IST</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A66A00]/25 text-[#F2D07C] border border-[#A66A00]/50 font-tabular">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>RESULT BEING UPDATED</span>
              </span>
            )}
            <span className="text-[11px] text-slate-300/80 font-tabular">
              Official Draw Day: <strong>{scheduledLottery?.drawDay || 'Scheduled'}</strong>
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STATE 1 & 2: COUNTDOWN & ACTIVE UPDATING STATES       */}
        {/* ---------------------------------------------------- */}
        {!isTodayAvailable && (
          <div className="space-y-6">
            {secondsLeft > 0 ? (
              /* STATE 1: COUNTDOWN BEFORE DRAW */
              <div className="bg-[#10201D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
                      DRAW STATUS
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                      RESULT NOT PUBLISHED YET
                    </h3>
                  </div>
                  <div className="text-xs text-slate-300">
                    Expected Time: <strong className="text-white">03:00:00 PM (IST)</strong>
                  </div>
                </div>

                {/* Big Visual Countdown Digits */}
                <div className="py-2">
                  <span className="text-[10px] font-extrabold text-[#C8A45D] uppercase tracking-widest block text-center mb-3">
                    LIVE COUNTDOWN TO RESULT
                  </span>

                  <div className="grid grid-cols-3 max-w-sm sm:max-w-md mx-auto gap-3 text-center">
                    {/* Hours */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4">
                      <span className="text-3xl sm:text-5xl font-mono font-black text-white block tracking-wider font-tabular">
                        {padZero(hours)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1">
                        HOURS
                      </span>
                    </div>

                    {/* Minutes */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4">
                      <span className="text-3xl sm:text-5xl font-mono font-black text-white block tracking-wider font-tabular">
                        {padZero(minutes)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1">
                        MINUTES
                      </span>
                    </div>

                    {/* Seconds */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4">
                      <span className="text-3xl sm:text-5xl font-mono font-black text-[#C8A45D] block tracking-wider font-tabular">
                        {padZero(seconds)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#C8A45D] uppercase tracking-wider block mt-1">
                        SECONDS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-300">
                    Results will automatically appear here the moment official gazette verification is complete. No page refresh required.
                  </p>
                </div>
              </div>
            ) : (
              /* STATE 2: COUNTDOWN ZERO / RESULT BEING UPDATED */
              <div className="bg-[#10201D] border border-[#A66A00]/40 rounded-2xl p-6 sm:p-8 space-y-5 text-center">
                <div className="w-12 h-12 border-3 border-[#C8A45D] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-[#C8A45D] uppercase tracking-widest block">
                    LIVE DRAW PROCEEDINGS IN PROGRESS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    RESULT BEING UPDATED
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Fetching the latest verified winning numbers from the official Kerala Lottery draw currently underway at Gorky Bhavan...
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 inline-flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Display Most Recent Draw as Reference while today's is pending */}
            {latestDraw && (
              <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('ui.previous_draw', 'Previous Draw:')}</span>
                  <strong className="text-white uppercase">{latestDraw.lottery?.name} ({latestDraw.drawNumber})</strong>
                </div>
                <Link
                  href={`/results/${latestDraw.lottery?.slug}/${latestDraw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="text-[#C8A45D] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>{t('ui.view_result', "View Yesterday's Result")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STATE 3: TODAY'S RESULT PUBLISHED                    */}
        {/* ---------------------------------------------------- */}
        {isTodayAvailable && draw && (
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
                    {t('ui.held_on', 'Draw Date')}
                  </span>
                  <span className="font-bold text-white text-sm mt-0.5 block font-tabular">
                    {drawDateFormatted}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wide">
                    {t('ui.draw_time', 'Draw Time')}
                  </span>
                  <span className="font-bold text-white text-sm mt-0.5 block font-tabular">
                    {draw.drawTime || '3:00 PM IST'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#16845B]" />
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
                    {t('ui.first_prize', '1st Prize')} ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                  </span>
                  {firstPrizeWinner?.location && (
                    <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C8A45D]" />
                      <span>{firstPrizeWinner.location}</span>
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-[#C69A3A] font-mono tracking-wider bg-black/50 px-4 py-2.5 rounded-xl border border-[#C69A3A]/30 inline-block font-tabular shadow-inner">
                    {firstPrizeWinner ? firstPrizeWinner.displayNumber : 'Checking...'}
                  </span>
                </div>
              </div>

              {/* 2nd Prize & Consolation Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {secondPrize && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wide">
                      {t('ui.second_prize', '2nd Prize')} ({formatINR(secondPrize.amount)})
                    </span>
                    <span className="font-mono font-bold text-white text-base mt-1 block font-tabular">
                      {secondPrize.winningNumbers?.[0]?.displayNumber || '—'}
                    </span>
                  </div>
                )}

                {consolationPrize && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wide">
                      {t('ui.consolation_prize', 'Consolation')} ({formatINR(consolationPrize.amount)})
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
                  href={`/results/date/${drawDateSlug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white font-bold text-xs transition-colors group shadow-sm cursor-pointer"
                >
                  <span>{t('ui.view_result', 'View Complete Prize Table')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {draw.sourceDocumentUrl && (
                  <a
                    href={draw.sourceDocumentUrl}
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
        )}
      </div>
    </div>
  );
}
