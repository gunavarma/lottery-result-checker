'use client';

import React, { useState } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';
import { NotificationModal } from './NotificationModal';

interface NotificationBannerProps {
  lotteryId?: string;
  lotteryName?: string;
  className?: string;
}

export function NotificationBanner({ lotteryId, lotteryName, className = '' }: NotificationBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className={`bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 border border-emerald-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Bell className="w-6 h-6 animate-swing" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                FCM Browser Notifications
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {lotteryName ? `Never Miss ${lotteryName} Results` : 'Get Kerala Lottery Result Alerts'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Receive an automatic push notification the moment official results are published by the Directorate of Kerala State Lotteries.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            aria-label="Enable Push Notifications"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0B3B32] hover:bg-[#072B24] text-white font-bold text-xs shadow-md border border-[#C8A45D]/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Bell className="w-4 h-4 text-[#C8A45D]" />
            <span>Enable Notifications</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <NotificationModal
          initialLotteryId={lotteryId}
          lotteryName={lotteryName}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
