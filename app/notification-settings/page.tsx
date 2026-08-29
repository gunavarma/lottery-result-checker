'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, ShieldCheck, Check, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { requestFcmToken } from '@/lib/firebase/client';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function NotificationSettingsPage() {
  const [allLotteries, setAllLotteries] = useState<any[]>([]);
  const [selectedLotteryIds, setSelectedLotteryIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSavePreferences = async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      let token = fcmToken;
      if (!token) {
        token = await requestFcmToken();
        if (token) {
          setFcmToken(token);
          localStorage.setItem('kl_fcm_token', token);
        }
      }

      if (!token) {
        throw new Error('FCM registration token could not be obtained.');
      }

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
          text: 'Notification preferences saved successfully! You will receive push alerts when official results are published.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: json.error || 'Failed to update preferences.',
        });
      }
    } catch (err: any) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to save notification settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
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
        text: 'Notifications disabled. You will no longer receive alerts on this device.',
      });
    } catch (err: any) {
      console.error('Error disabling notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Notification Preferences' },
        ]}
      />

      {/* Header */}
      <div className="space-y-2 border-b border-[#E2E7E3] pb-6">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Alert Preferences
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Notification Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl">
          Receive instantaneous browser push notifications when selected Kerala State Lottery results are officially published.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-6">
        {/* Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F7F7F4] border border-[#E2E7E3]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#68736E] uppercase tracking-wider block">
              Browser Push Delivery Status
            </span>
            <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base">
              {permissionState === 'granted' && fcmToken ? (
                <div className="flex items-center gap-2 text-[#16845B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16845B]" />
                  <span>Notifications Active</span>
                </div>
              ) : permissionState === 'denied' ? (
                <div className="flex items-center gap-2 text-[#B54747]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B54747]" />
                  <span>Notifications Blocked in Browser</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#68736E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5CE]" />
                  <span>Not Yet Configured</span>
                </div>
              )}
            </div>
          </div>

          {fcmToken && (
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#B54747] border border-[#B54747]/30 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disable Alerts</span>
            </button>
          )}
        </div>

        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-[#A66A00]/10 border border-[#A66A00]/30 text-xs text-[#A66A00] space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>How to unblock notifications:</span>
            </h4>
            <p>
              Click the lock icon in your browser URL bar, set <strong>Notifications</strong> to <strong>Allow</strong>, and refresh the page.
            </p>
          </div>
        )}

        {/* Lottery Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#17201D] uppercase tracking-wide">
              Subscribed Lottery Schemes
            </h2>
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B]"
            >
              {selectAll ? 'Deselect All' : 'Select All Lotteries'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allLotteries.map((lot) => {
              const checked = selectAll || selectedLotteryIds.includes(lot.id);
              return (
                <button
                  type="button"
                  key={lot.id}
                  onClick={() => toggleLottery(lot.id)}
                  className={`p-3.5 rounded-2xl text-left text-xs font-semibold flex items-center justify-between gap-3 border transition-all ${
                    checked
                      ? 'bg-[#F1F4F2] border-[#0B3B32]/40 text-[#0B3B32] font-bold'
                      : 'bg-white border-[#E2E7E3] text-[#17201D] hover:bg-[#F7F7F4]'
                  }`}
                >
                  <div>
                    <span className="block text-[#17201D] font-bold">{lot.name}</span>
                    <span className="text-[11px] text-[#68736E] font-normal">{lot.drawDay} • 3:00 PM</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                      checked ? 'bg-[#0B3B32] border-[#0B3B32] text-white' : 'border-[#E2E7E3] bg-white'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleSavePreferences}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-tabular"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-[#C8A45D]" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] text-xs text-[#68736E] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#17201D]">
          <ShieldCheck className="w-4 h-4 text-[#16845B]" />
          <span>FCM Privacy & Security Standard</span>
        </div>
        <p className="leading-relaxed">
          Push notification registration uses Firebase Cloud Messaging (FCM) anonymous device tokens. No personally identifiable information, telephone numbers, emails, or individual ticket queries are collected or associated with notification subscriptions.
        </p>
      </div>
    </div>
  );
}
