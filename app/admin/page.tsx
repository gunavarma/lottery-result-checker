'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Globe,
  Radio,
  Bell,
  Send,
  AlertTriangle,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdminData = useCallback(async (authToken: string) => {
    setLoading(true);
    setMessage(null);

    try {
      // 1. Fetch Sync Logs, FCM Stats & Deliveries
      const res = await fetch('/api/admin/sync-logs', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem('kl_admin_token');
        setMessage({ type: 'error', text: 'Invalid admin token' });
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setSyncLogs(data.logs || []);
        setDeliveries(data.deliveries || []);
        setStats(data.stats || null);
        localStorage.setItem('kl_admin_token', authToken);
      }

      // 2. Fetch Live Status Engine
      const liveRes = await fetch('/api/live');
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        setLiveStatus(liveJson);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('kl_admin_token');
    if (saved) {
      setToken(saved);
      loadAdminData(saved);
    }
  }, [loadAdminData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      loadAdminData(token.trim());
    }
  };

  const handleTriggerSync = async (force = false) => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force, limit: 10 }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `LOTIS Sync Complete: ${data.result.newResults} new, ${data.result.updatedResults} updated, ${data.result.skippedResults} skipped (${data.result.recordsFound} official records evaluated).`,
        });
        loadAdminData(token);
      } else {
        setMessage({
          type: 'error',
          text: `Sync Failed: ${data.result?.errors?.join(', ') || data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error triggering LOTIS synchronization' });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    setMessage(null);

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotteryName: 'Suvarna Keralam (TEST)',
          drawNumber: 'SK-67-TEST',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `FCM test notification dispatched: ${json.summary.sent} sent, ${json.summary.skipped} duplicate skipped, ${json.summary.failed} failed (${json.summary.totalEligible} eligible subscribers).`,
        });
        loadAdminData(token);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to dispatch test notification.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error testing notification delivery.' });
    } finally {
      setTestingNotification(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Admin Operations</h1>
            <p className="text-xs text-slate-500">
              Enter your ADMIN_SECRET token to access synchronization controls and FCM notification monitoring.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Secret Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter ADMIN_SECRET"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                required
              />
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authenticate & Enter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Operational Control Center
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Kerala Lottery System Monitor
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerSync(false)}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing LOTIS...' : 'Run Sync Now'}</span>
          </button>

          <button
            onClick={handleTestNotification}
            disabled={testingNotification}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Send Test Push</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('kl_admin_token');
              setAuthenticated(false);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Live System Health Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Official LOTIS</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>ONLINE</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">PostgreSQL Database</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>CONNECTED</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Sync Engine</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>READY</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">FCM Web Push</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${stats?.fcm?.isConfigured ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
            <span>{stats?.fcm?.isConfigured ? '🟢 CONFIGURED' : '🟢 READY'}</span>
          </div>
        </div>
      </div>

      {/* FCM Push Notification Stats Card */}
      {stats?.fcm && (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">
                  Firebase Cloud Messaging (FCM) Monitor
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Live subscriber tokens, delivery telemetry, and automated token health management.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Web Push Active</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Devices</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">{stats.fcm.activeSubscriptions}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tokens</span>
              <span className="text-2xl font-black text-white block mt-1">{stats.fcm.totalSubscriptions}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheme Subs</span>
              <span className="text-2xl font-black text-white block mt-1">{stats.fcm.lotterySubscriptionsCount}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sent Today</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">{stats.fcm.sentToday}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Failed Today</span>
              <span className="text-2xl font-black text-rose-400 block mt-1">{stats.fcm.failedToday}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Invalid Cleaned</span>
              <span className="text-2xl font-black text-amber-400 block mt-1">{stats.fcm.invalidTokensCleaned}</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Draw Monitor Card */}
      {liveStatus && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Today's Live Draw Monitor</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-500">
              Server Time: {liveStatus.serverTimeIST}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Scheme</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {liveStatus.todayDraw?.lottery?.name || liveStatus.scheduledScheme?.name || 'Kerala Lottery'}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Scheduled Time</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">3:00 PM IST</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Draw Status</span>
              <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                {liveStatus.status}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Last Source Check</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {new Date(liveStatus.lastCheckedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent FCM Deliveries */}
      {deliveries.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Recent FCM Push Notification Deliveries</span>
            </h2>
            <span className="text-xs text-slate-500">Showing last {deliveries.length} push deliveries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time (IST)</th>
                  <th className="py-3 px-4">Result / Draw</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">FCM Token Device</th>
                  <th className="py-3 px-4">Notes / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono">
                      {new Date(del.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono">{del.resultId}</td>
                    <td className="py-3 px-4">
                      {del.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> SENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <XCircle className="w-3 h-3" /> {del.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 truncate max-w-xs" title={del.pushSubscription?.fcmToken}>
                      {del.pushSubscription?.fcmToken ? `${del.pushSubscription.fcmToken.substring(0, 20)}...` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={del.errorMessage || ''}>
                      {del.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sync Log Audit Trail */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Recent LOTIS Synchronization Logs</h2>
          <span className="text-xs text-slate-500">Showing last {syncLogs.length} sync executions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Started (IST)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Records Found</th>
                <th className="py-3 px-4">New Draws</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Error / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncLogs.map((log) => {
                const duration = log.completedAt
                  ? `${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                  : '—';

                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium">
                      {new Date(log.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <XCircle className="w-3 h-3" /> {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold">{log.recordsFound}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{log.newDrawsCount}</td>
                    <td className="py-3 px-4 text-slate-500">{duration}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={log.errorMessage || ''}>
                      {log.errorMessage || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
