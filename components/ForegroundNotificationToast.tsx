'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Bell, X, ArrowRight } from 'lucide-react';
import { onForegroundFcmMessage } from '@/lib/firebase/client';

export function ForegroundNotificationToast() {
  const [notification, setNotification] = useState<{
    title: string;
    body: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onForegroundFcmMessage((payload) => {
      console.log('[Foreground FCM Message Received]:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Result Published';
      const body = payload.notification?.body || payload.data?.body || 'Official Kerala Lottery winning numbers are now available.';
      const url = payload.data?.url || '/live';

      setNotification({ title, body, url });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 max-w-md z-50 animate-slideDown">
      <div className="bg-[#10201D] text-white rounded-3xl p-5 shadow-2xl border border-[#0B3B32]/60 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B3B32] flex items-center justify-center text-[#C8A45D] shrink-0 border border-[#C8A45D]/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
                Official Result Alert
              </span>
              <h4 className="font-extrabold text-sm text-white leading-tight">
                {notification.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 pl-1">
          {notification.body}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <Link
            href={notification.url}
            onClick={() => setNotification(null)}
            className="px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs font-tabular"
          >
            <span>View Result</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
