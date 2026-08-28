'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, ShieldCheck, Check, Star, Lock } from 'lucide-react';
import { requestFcmToken } from '@/lib/firebase/client';

interface NotificationModalProps {
  isOpen?: boolean;
  initialLotteryId?: string;
  lotteryName?: string;
  onClose: () => void;
}

export function NotificationModal({
  isOpen = true,
  initialLotteryId,
  lotteryName,
  onClose,
}: NotificationModalProps) {
  if (!isOpen) return null;

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
          text: 'Notifications Enabled. You will receive an instant alert when official results are published.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10201D]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E2E7E3] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full text-[#68736E] hover:text-[#17201D] hover:bg-[#F7F7F4] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#0B3B32] text-xs font-bold uppercase tracking-wider font-tabular">
            <Bell className="w-4 h-4 text-[#C8A45D]" />
            <span>FCM Web Push Notifications</span>
          </div>
          <h3 className="text-2xl font-black text-[#17201D]">
            Get Kerala Lottery Result Alerts
          </h3>
          <p className="text-xs text-[#68736E] leading-relaxed">
            Allow browser notifications to receive an automatic alert the moment your selected Kerala State Lottery results are officially published by the Directorate of Kerala State Lotteries.
          </p>
        </div>

        {/* Permission Denied Notice */}
        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-[#A66A00]/10 border border-[#A66A00]/30 text-xs text-[#A66A00] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Notifications are blocked in your browser</span>
            </div>
            <p>
              To enable alerts, open your browser site settings (click the lock icon near the URL bar), change <strong>Notifications</strong> to <strong>Allow</strong>, and reload this page.
            </p>
          </div>
        )}

        {/* Lottery Selection List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#17201D] uppercase tracking-wide">
              Choose Lotteries:
            </span>
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="text-xs font-bold text-[#0B3B32] hover:underline"
            >
              {selectAll ? 'Deselect All' : 'Select All Lotteries'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-[#E2E7E3] rounded-2xl bg-[#F7F7F4]">
            {allLotteries.map((lot) => {
              const checked = selectAll || selectedLotteryIds.includes(lot.id);
              return (
                <button
                  type="button"
                  key={lot.id}
                  onClick={() => toggleLottery(lot.id)}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 border transition-all ${
                    checked
                      ? 'bg-[#F1F4F2] border-[#0B3B32]/40 text-[#0B3B32] font-bold'
                      : 'bg-white border-[#E2E7E3] text-[#17201D] hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{lot.name}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked ? 'bg-[#0B3B32] border-[#0B3B32] text-white' : 'border-[#E2E7E3] bg-white'
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
                ? 'bg-[#16845B]/10 border-[#16845B]/30 text-[#16845B]'
                : statusMsg.type === 'error'
                ? 'bg-[#B54747]/10 border-[#B54747]/30 text-[#B54747]'
                : 'bg-[#F7F7F4] border-[#E2E7E3] text-[#17201D]'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
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
              className="w-full py-3.5 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-tabular"
            >
              <Bell className="w-4 h-4 text-[#C8A45D]" />
              <span>{loading ? 'Registering FCM...' : fcmToken ? 'Update Notification Preferences' : 'Enable Notifications'}</span>
            </button>
          )}

          {fcmToken && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#16845B] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Notifications Active
              </span>
              <button
                type="button"
                onClick={handleUnsubscribe}
                className="text-[#68736E] hover:text-[#B54747] underline font-medium"
              >
                Disable Notifications
              </button>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="text-center pt-2 border-t border-[#E2E7E3]">
          <p className="text-[11px] text-[#68736E] flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-[#68736E]" />
            <span>Anonymous subscription using Firebase Cloud Messaging. No personal information or email required.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
