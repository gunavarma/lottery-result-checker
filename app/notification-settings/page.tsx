'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, ShieldCheck, Check, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { requestFcmToken } from '@/lib/firebase/client';

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
      .catch((err) => console.warn('Failed to load lotteries:', err));
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
          text: '🟢 Notification preferences saved successfully! You will receive push alerts for your selected lotteries.',
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
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
            User Preferences
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          🔔 Notification Settings
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Manage your browser push notification preferences for official Kerala State Lottery results.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Browser Push Status
            </span>
            <div className="flex items-center gap-2 font-extrabold text-base">
              {permissionState === 'granted' && fcmToken ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700">🟢 Notifications Enabled</span>
                </>
              ) : permissionState === 'denied' ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-rose-700">🔴 Notifications Blocked in Browser</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-slate-600">⚪ Not Configured</span>
                </>
              )}
            </div>
          </div>

          {fcmToken && (
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disable Notifications</span>
            </button>
          )}
        </div>

        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>How to unblock notifications:</span>
            </h4>
            <p>
              Click the lock/tune icon near your browser URL bar, set <strong>Notifications</strong> to <strong>Allow</strong>, and reload this page.
            </p>
          </div>
        )}

        {/* Lottery Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Subscribed Kerala Lotteries
            </h2>
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="text-xs font-bold text-emerald-700 hover:underline"
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
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="block text-slate-900 font-bold">{lot.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{lot.drawDay} • 3:00 PM</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
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

        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleSavePreferences}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            <span>{loading ? 'Saving Preferences...' : 'Save Notification Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Transparency & Privacy Notice */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-xs text-slate-500 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>FCM Privacy Guarantee</span>
        </div>
        <p>
          Push notification registration uses Firebase Cloud Messaging (FCM) anonymous device identifiers. No personal identifying information, email addresses, phone numbers, or ticket queries are collected or associated with notification subscriptions.
        </p>
      </div>
    </div>
  );
}
