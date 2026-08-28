'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, ShieldCheck, Check, Star } from 'lucide-react';
import { requestFcmToken } from '@/lib/firebase/client';

interface NotificationModalProps {
  initialLotteryId?: string;
  lotteryName?: string;
  onClose: () => void;
}

export function NotificationModal({
  initialLotteryId,
  lotteryName,
  onClose,
}: NotificationModalProps) {
  const [allLotteries, setAllLotteries] = useState<any[]>([]);
  const [selectedLotteryIds, setSelectedLotteryIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // 1. Check browser permission & load available lotteries
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    const savedToken = localStorage.getItem('kl_fcm_token');
    if (savedToken) {
      setFcmToken(savedToken);
    }

    fetch('/api/lotteries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lotteries) {
          setAllLotteries(data.lotteries);

          // If initial lottery passed, select it
          if (initialLotteryId) {
            setSelectedLotteryIds([initialLotteryId]);
            setSelectAll(false);
          } else {
            // Check favorites from localStorage
            const savedFavs = localStorage.getItem('kl_favorites');
            if (savedFavs) {
              try {
                const favSlugs: string[] = JSON.parse(savedFavs);
                const favIds = data.lotteries
                  .filter((l: any) => favSlugs.includes(l.slug))
                  .map((l: any) => l.id);
                if (favIds.length > 0) {
                  setSelectedLotteryIds(favIds);
                  setSelectAll(false);
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }
      })
      .catch((err) => console.warn('Failed to load lotteries:', err));
  }, [initialLotteryId]);

  const toggleLottery = (id: string) => {
    setSelectAll(false);
    if (selectedLotteryIds.includes(id)) {
      setSelectedLotteryIds(selectedLotteryIds.filter((item) => item !== id));
    } else {
      setSelectedLotteryIds([...selectedLotteryIds, id]);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedLotteryIds([]);
    } else {
      setSelectAll(true);
      setSelectedLotteryIds(allLotteries.map((l) => l.id));
    }
  };

  const handleEnablePush = async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      // 1. Request FCM registration token via Firebase Web Messaging
      const token = await requestFcmToken();

      if (!token) {
        throw new Error('Could not retrieve FCM token.');
      }

      setFcmToken(token);
      localStorage.setItem('kl_fcm_token', token);
      setPermissionState('granted');

      // 2. Register token and selected lotteries on backend
      const res = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          lotteryIds: selectAll ? [] : selectedLotteryIds,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          type: 'success',
          text: '🟢 Notifications Enabled! You will receive an instant alert when official results are published.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: json.error || 'Failed to save notification subscription.',
        });
      }
    } catch (err: any) {
      console.error('FCM subscription error:', err);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
      if (Notification.permission === 'denied') {
        setStatusMsg({
          type: 'error',
          text: 'Notifications are blocked in your browser. Please allow notifications in your browser site settings.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: err.message || 'Notification permission request was cancelled or failed.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!fcmToken) return;
    setLoading(true);

    try {
      await fetch('/api/notifications/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fcmToken }),
      });

      localStorage.removeItem('kl_fcm_token');
      setFcmToken(null);
      setStatusMsg({
        type: 'info',
        text: 'You have been unsubscribed from push notifications.',
      });
    } catch (err) {
      console.error('Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-4 h-4" />
            <span>FCM Web Push Notifications</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            Get Kerala Lottery Result Alerts
          </h3>
          <p className="text-xs text-slate-500">
            Allow browser notifications to receive an automatic alert the moment your selected Kerala State Lottery results are officially published by the Directorate of Kerala State Lotteries.
          </p>
        </div>

        {/* Permission Denied Notice */}
        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Notifications are blocked in your browser</span>
            </div>
            <p>
              To enable alerts, open your browser site settings (click the lock/tune icon near the URL bar), change <strong>Notifications</strong> to <strong>Allow</strong>, and reload this page.
            </p>
          </div>
        )}

        {/* Lottery Selection List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Choose Lotteries:
            </span>
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {selectAll ? 'Deselect All' : 'Select All Lotteries'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50">
            {allLotteries.map((lot) => {
              const checked = selectAll || selectedLotteryIds.includes(lot.id);
              return (
                <button
                  type="button"
                  key={lot.id}
                  onClick={() => toggleLottery(lot.id)}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 border transition-all ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{lot.name}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {permissionState !== 'denied' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleEnablePush}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{loading ? 'Registering FCM...' : fcmToken ? 'Update Notification Preferences' : 'Enable Notifications'}</span>
            </button>
          )}

          {fcmToken && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Notifications Active
              </span>
              <button
                type="button"
                onClick={handleUnsubscribe}
                className="text-slate-400 hover:text-rose-600 underline font-medium"
              >
                Disable Notifications
              </button>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="text-center pt-1 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            🔒 Anonymous subscription using Firebase Cloud Messaging. No personal information or email required.
          </p>
        </div>
      </div>
    </div>
  );
}
