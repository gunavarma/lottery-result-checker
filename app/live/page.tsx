'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { NotificationModal } from '@/components/NotificationModal';
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
  AlertTriangle,
} from 'lucide-react';

export default function LiveDrawPage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLiveStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/live', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setLiveData(json);
        if (json.countdownSeconds) {
          setCountdown(json.countdownSeconds);
        }
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch live draw data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  // Dynamic Polling Interval: 30s during active draw period, 90s otherwise
  useEffect(() => {
    if (!liveData) return;

    const isLiveHours = liveData.status === 'CHECKING' || liveData.status === 'RESULT_PENDING';
    const intervalMs = isLiveHours ? 30000 : 90000;

    // Stop frequent polling once result is officially published
    if (liveData.status === 'PUBLISHED') {
      return;
    }

    const interval = setInterval(() => {
      fetchLiveStatus();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [liveData, fetchLiveStatus]);

  // Local Countdown Ticker
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Live Result' }]} />

      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE RESULT FEED</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Official Kerala State Lotteries
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Kerala Lottery Live Results
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time status monitoring, draw countdown, and verified winning numbers directly from LOTIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-200 transition-colors shadow-2xs"
          >
            <Bell className="w-4 h-4 text-emerald-700" />
            <span>Notify Me</span>
          </button>

          <button
            onClick={() => fetchLiveStatus(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
            title="Refresh live status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {status === 'PUBLISHED' && (
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors hidden sm:inline-flex"
              title="Print official result"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* State Machine Status Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Status Indicator Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            {status === 'PUBLISHED' ? (
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            ) : status === 'CHECKING' ? (
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping" />
            ) : status === 'SOURCE_UNAVAILABLE' ? (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
            )}

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Draw Status
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {status === 'PUBLISHED' && '🟢 OFFICIAL RESULT PUBLISHED'}
                {status === 'CHECKING' && '🔄 CHECKING OFFICIAL SOURCE (LOTIS)'}
                {status === 'RESULT_PENDING' && '⏳ DRAW TIME REACHED — WAITING FOR PUBLICATION'}
                {status === 'SCHEDULED' && '🟡 SCHEDULED DRAW (TODAY 3:00 PM IST)'}
                {status === 'SOURCE_UNAVAILABLE' && '⚠️ OFFICIAL SOURCE TEMPORARILY UNAVAILABLE'}
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="block">Last checked:</span>
            <span className="font-mono font-bold text-slate-800">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Scheduled Scheme Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase">Today's Lottery</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {draw?.lottery?.name || liveData?.scheduledScheme?.name || 'Kerala State Lottery'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Draw Schedule: <strong>3:00 PM IST</strong> at Gorky Bhavan, Thiruvananthapuram.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ticket Price</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{draw?.lottery?.ticketPrice || liveData?.scheduledScheme?.ticketPrice || 40}
              </span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Draw Number</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {draw?.drawNumber || liveData?.scheduledScheme?.code || 'KL-TODAY'}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Box (If draw is pending / scheduled) */}
        {status !== 'PUBLISHED' && (
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-md">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
              {status === 'RESULT_PENDING' || countdown <= 0
                ? 'OFFICIAL DRAW UNDERWAY'
                : 'COUNTDOWN TO SCHEDULED DRAW'}
            </span>

            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-3 sm:gap-6 font-mono">
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black">{hours}</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block mt-1">Hours</span>
                </div>
                <span className="text-3xl font-bold opacity-60">:</span>
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black">{minutes}</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block mt-1">Minutes</span>
                </div>
                <span className="text-3xl font-bold opacity-60">:</span>
                <div className="bg-white/10 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10">
                  <span className="text-3xl sm:text-5xl font-black text-amber-400">{seconds}</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block mt-1">Seconds</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-bold border border-emerald-500/30">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Waiting for official gazette publication...</span>
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  The draw is currently being conducted by the Directorate of Kerala State Lotteries. Results will appear automatically here once signed and uploaded.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 1st Prize Winner Showcase (When result is published) */}
        {status === 'PUBLISHED' && draw && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-white rounded-2xl p-6 border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1,00,00,000'})
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-slate-900 font-mono tracking-wider">
                    {firstWinner ? firstWinner.displayNumber : '—'}
                  </span>
                </div>
              </div>

              {firstWinner?.location && (
                <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs text-xs space-y-0.5">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold">
                    Winning Agent Location
                  </span>
                  <span className="text-base font-extrabold text-slate-900 block">
                    📍 {firstWinner.location}
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

      {/* When published, render full prize table */}
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
