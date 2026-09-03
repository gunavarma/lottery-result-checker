'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { NotificationModal } from '@/components/NotificationModal';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useLiveResults } from '@/hooks/queries/useLiveResults';
import { formatINR } from '@/lib/prisma';
import {
  Clock,
  Radio,
  Award,
  Bell,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function LiveDrawPage() {
  const { data: liveData, isLoading, isFetching, refetch } = useLiveResults();
  const [countdown, setCountdown] = useState<number>(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // Sync local countdown with server countdown seconds
  useEffect(() => {
    if (liveData?.countdownSeconds !== undefined) {
      setCountdown(liveData.countdownSeconds);
    }
  }, [liveData?.countdownSeconds]);

  // Local 1-second countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds } = formatCountdown(countdown);

  const status = liveData?.status || 'SCHEDULED';
  const draw = liveData?.todayDraw || (status === 'PUBLISHED' ? liveData?.latestDraw : null);
  const firstPrize = draw?.prizes?.find((p: any) => p.tierNumber === 1 || p.orderIndex === 0);
  const firstWinner = firstPrize?.winningNumbers?.[0];

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // 1. Initial Skeleton only if no data exists at all on first cold load
  if (isLoading && !liveData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-pulse">
        <div className="h-6 w-48 bg-[#E2E7E3] rounded-lg" />
        <div className="h-28 bg-[#E2E7E3] rounded-3xl" />
        <div className="h-96 bg-[#E2E7E3] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Live Result Feed' },
        ]}
      />

      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B3B32]/10 text-[#0B3B32] font-tabular">
              <span className="w-2 h-2 rounded-full bg-[#16845B]" />
              <span>LIVE RESULT SYNCHRONIZATION</span>
            </span>
            <SyncIndicator isFetching={isFetching} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] mt-2 tracking-tight">
            Kerala Lottery Live Results
          </h1>
          <p className="text-xs sm:text-sm text-[#68736E] mt-1">
            Real-time status monitoring, draw schedule countdown, and verified winning numbers directly from database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs font-tabular cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#C8A45D]" />
            <span>Notify Me</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#0B3B32]' : ''}`} />
          </button>

          {status === 'PUBLISHED' && (
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] transition-colors hidden sm:inline-flex cursor-pointer"
              title="Print official result"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* State Machine Status Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
        {/* Status Indicator Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7E3] pb-5">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                status === 'PUBLISHED'
                  ? 'bg-[#16845B]'
                  : status === 'CHECKING'
                  ? 'bg-[#A66A00] animate-pulse'
                  : 'bg-[#68736E]'
              }`}
            />

            <div>
              <span className="text-[10px] font-bold text-[#68736E] uppercase tracking-wider block font-tabular">
                Draw Status
              </span>
              <h2 className="text-xl font-black text-[#17201D] mt-0.5 font-tabular">
                {status === 'PUBLISHED' && 'OFFICIAL RESULT PUBLISHED'}
                {status === 'CHECKING' && 'CHECKING OFFICIAL LOTIS SOURCE'}
                {status === 'RESULT_PENDING' && 'DRAW UNDERWAY — WAITING FOR GAZETTE'}
                {status === 'SCHEDULED' && 'SCHEDULED DRAW (TODAY 3:00 PM IST)'}
                {status === 'SOURCE_UNAVAILABLE' && 'OFFICIAL SOURCE TEMPORARILY UNAVAILABLE'}
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-[#68736E]">
            <span className="block text-[10px] uppercase font-bold tracking-wide">Server Time (IST)</span>
            <span className="font-mono font-bold text-[#17201D] font-tabular">
              {liveData?.serverTimeIst || '3:00 PM IST'}
            </span>
          </div>
        </div>

        {/* Scheduled Scheme Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3]">
          <div>
            <span className="text-xs font-bold text-[#0B3B32] uppercase font-tabular">Today's Lottery</span>
            <h3 className="text-2xl font-extrabold text-[#17201D] mt-0.5">
              {draw?.lottery?.name || liveData?.scheduledLottery?.name || 'Kerala State Lottery'}
            </h3>
            <p className="text-xs text-[#68736E] mt-1">
              Draw Schedule: <strong>3:00 PM IST</strong> at Gorky Bhavan, Thiruvananthapuram.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2E7E3]">
              <span className="text-[#68736E] block text-[10px] uppercase font-bold">Ticket Price</span>
              <span className="font-black text-[#17201D] text-sm font-tabular">
                ₹{draw?.lottery?.ticketPrice || liveData?.scheduledLottery?.ticketPrice || 40}
              </span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2E7E3]">
              <span className="text-[#68736E] block text-[10px] uppercase font-bold">Draw Code</span>
              <span className="font-mono font-bold text-[#0B3B32] text-sm font-tabular">
                {draw?.drawNumber || liveData?.scheduledLottery?.code || 'KL-TODAY'}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Box (If draw is pending / scheduled) */}
        {status !== 'PUBLISHED' && (
          <div className="bg-[#10201D] text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-[#0B3B32]/40">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C8A45D] font-tabular">
              {status === 'RESULT_PENDING' || countdown <= 0
                ? 'OFFICIAL DRAW PROCEEDINGS IN PROGRESS'
                : 'COUNTDOWN TO 3:00 PM DRAW'}
            </span>

            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-3 sm:gap-6 font-mono font-tabular">
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black">{hours}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1">Hours</span>
                </div>
                <span className="text-3xl font-bold opacity-60">:</span>
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black">{minutes}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1">Minutes</span>
                </div>
                <span className="text-3xl font-bold opacity-60">:</span>
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black text-[#C8A45D]">{seconds}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#C8A45D] block mt-1">Seconds</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
                  <Clock className="w-4 h-4 text-[#C8A45D] animate-spin" />
                  <span>Waiting for official gazette publication...</span>
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  The draw is being conducted by the Directorate of Kerala State Lotteries. Results will synchronize automatically once officially certified.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 1st Prize Winner Showcase (When result is published) */}
        {status === 'PUBLISHED' && draw && (
          <div className="space-y-6">
            <div className="bg-[#10201D] text-white rounded-2xl p-6 sm:p-8 border border-[#0B3B32]/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5 font-tabular">
                  <Award className="w-4 h-4 text-[#C8A45D]" />
                  1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-[#C8A45D] font-mono tracking-wider font-tabular bg-black/40 px-4 py-2 rounded-xl border border-[#C8A45D]/30 inline-block shadow-inner">
                    {firstWinner ? firstWinner.displayNumber : '—'}
                  </span>
                </div>
              </div>

              {firstWinner?.location && (
                <div className="bg-white/10 border border-white/15 rounded-xl p-4 text-xs space-y-1">
                  <span className="text-slate-300 block uppercase text-[10px] font-bold tracking-wide">
                    Winning Agent District
                  </span>
                  <span className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C8A45D]" />
                    <span>{firstWinner.location}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Social Share Bar */}
            <ResultShareBar
              title={`Kerala Lottery Result — ${draw.lottery?.name} (${draw.drawNumber})`}
              url={`/result/${new Date(draw.drawDate).toISOString().split('T')[0]}/${draw.lottery?.slug}`}
            />
          </div>
        )}
      </div>

      {/* Full Prize Table When Published */}
      {status === 'PUBLISHED' && draw && (
        <div className="space-y-6">
          <OfficialSourceBadge
            sourceUrl={draw.sourceUrl}
            drawNumber={draw.drawNumber}
            drawDate={new Date(draw.drawDate).toLocaleDateString('en-GB')}
          />

          <PrizeTable
            prizes={draw.prizes || []}
            lotteryName={draw.lottery?.name}
            drawNumber={draw.drawNumber}
          />
        </div>
      )}

      {/* Notification Modal */}
      {showNotifyModal && (
        <NotificationModal
          initialLotteryId={draw?.lotteryId}
          lotteryName={draw?.lottery?.name || 'Kerala Lottery'}
          onClose={() => setShowNotifyModal(false)}
        />
      )}
    </div>
  );
}
