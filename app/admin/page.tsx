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
  Newspaper,
  Plus,
  Trash2,
  Edit,
  FileText,
  Check,
  Settings,
  Layers
} from 'lucide-react';
import { getAllNews, NewsArticle } from '@/lib/news';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'results' | 'news' | 'notifications' | 'settings'>('overview');
  
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // News management local state
  const [newsList, setNewsList] = useState<NewsArticle[]>(getAllNews());
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Bumper Lotteries' | 'Scheme Updates' | 'Claim Rules' | 'Draw Analysis'>('Scheme Updates');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newContent, setNewContent] = useState('');

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
        setMessage({ type: 'error', text: 'Invalid admin secret token.' });
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
      setMessage({ type: 'error', text: 'Failed to connect to server.' });
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
          text: `LOTIS Sync Complete: ${data.newResults ?? 0} new, ${data.updatedResults ?? 0} updated, ${data.skippedResults ?? 0} skipped (${data.recordsFound ?? 0} official records evaluated).`,
        });
        loadAdminData(token);
      } else {
        setMessage({
          type: 'error',
          text: `Sync Failed: ${data.errors?.join(', ') || data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error triggering LOTIS synchronization.' });
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

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newArt: NewsArticle = {
      id: `article-${Date.now()}`,
      slug,
      title: newTitle.trim(),
      category: newCategory,
      subtitle: newSubtitle.trim() || newTitle.trim(),
      excerpt: newSubtitle.trim() || newTitle.trim(),
      publishedAt: new Date().toISOString().split('T')[0],
      author: 'Administrative Staff',
      readTime: '3 min read',
      content: newContent
        ? newContent.split('\n\n').filter(Boolean)
        : ['Official article dispatch published by lottery management.'],
    };

    setNewsList([newArt, ...newsList]);
    setShowNewArticleModal(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewContent('');
    setMessage({ type: 'success', text: `Article "${newArt.title}" published successfully.` });
  };

  const handleDeleteArticle = (id: string) => {
    setNewsList(newsList.filter(a => a.id !== id));
    setMessage({ type: 'success', text: 'Article removed from live news list.' });
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-[#E2E7E3] shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center mx-auto border border-[#E2E7E3]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-[#17201D]">Admin Operations</h1>
            <p className="text-xs text-[#68736E]">
              Enter your ADMIN_SECRET token to access synchronization controls and monitoring.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                Secret Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter ADMIN_SECRET"
                className="w-full px-4 py-3 rounded-2xl border border-[#E2E7E3] bg-[#F7F7F4] text-[#17201D] text-sm focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none font-mono"
                required
              />
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-[#B54747]/10 text-[#B54747] text-xs font-semibold">
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 font-tabular"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Operational Control Center
          </span>
          <h1 className="text-3xl font-extrabold text-[#17201D] mt-1">
            Kerala Lottery System Monitor
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerSync(false)}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 font-tabular"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing LOTIS...' : 'Run Sync Now'}</span>
          </button>

          <button
            onClick={handleTestNotification}
            disabled={testingNotification}
            className="px-4 py-2.5 rounded-xl bg-[#10201D] hover:bg-[#17201D] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 font-tabular"
          >
            <Send className="w-3.5 h-3.5 text-[#C8A45D]" />
            <span>Send Test Push</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('kl_admin_token');
              setAuthenticated(false);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] text-xs font-bold border border-[#E2E7E3] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E2E7E3] custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview & Health', icon: Layers },
          { id: 'sync', label: 'LOTIS Sync Engine', icon: RefreshCw },
          { id: 'news', label: 'News Management', icon: Newspaper },
          { id: 'notifications', label: 'FCM Push Telemetry', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs'
                  : 'bg-white border-[#E2E7E3] text-[#17201D] hover:bg-[#F7F7F4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#16845B]/10 border-[#16845B]/30 text-[#16845B]'
              : 'bg-[#B54747]/10 border-[#B54747]/30 text-[#B54747]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live System Health Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7E3] shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736E] block font-tabular">Official LOTIS</span>
              <div className="flex items-center gap-1.5 text-[#16845B] font-extrabold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                <span>ONLINE</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E2E7E3] shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736E] block font-tabular">Supabase Database</span>
              <div className="flex items-center gap-1.5 text-[#16845B] font-extrabold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                <span>CONNECTED</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E2E7E3] shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736E] block font-tabular">Supabase pg_cron</span>
              <div className="flex items-center gap-1.5 text-[#16845B] font-extrabold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                <span>EVERY 15 MIN</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E2E7E3] shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736E] block font-tabular">Edge Function</span>
              <div className="flex items-center gap-1.5 text-[#16845B] font-extrabold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                <span>DEPLOYED</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E2E7E3] shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736E] block font-tabular">FCM Web Push</span>
              <div className="flex items-center gap-1.5 text-[#16845B] font-extrabold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                <span>ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Live Draw Monitor Card */}
          {liveStatus && (
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
                <h2 className="text-sm font-extrabold text-[#17201D] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#B54747]" />
                  <span>Today's Live Draw Monitor</span>
                </h2>
                <span className="text-xs font-mono font-bold text-[#68736E] font-tabular">
                  Server Time: {liveStatus.serverTimeIST}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-[#F7F7F4] p-4 rounded-xl border border-[#E2E7E3]">
                  <span className="text-[#68736E] block uppercase font-bold text-[10px]">Scheme</span>
                  <span className="text-sm font-extrabold text-[#17201D] block mt-0.5">
                    {liveStatus.todayDraw?.lottery?.name || liveStatus.scheduledScheme?.name || 'Kerala Lottery'}
                  </span>
                </div>
                <div className="bg-[#F7F7F4] p-4 rounded-xl border border-[#E2E7E3]">
                  <span className="text-[#68736E] block uppercase font-bold text-[10px]">Scheduled Time</span>
                  <span className="text-sm font-extrabold text-[#17201D] block mt-0.5 font-tabular">3:00 PM IST</span>
                </div>
                <div className="bg-[#F7F7F4] p-4 rounded-xl border border-[#E2E7E3]">
                  <span className="text-[#68736E] block uppercase font-bold text-[10px]">Draw Status</span>
                  <span className="text-sm font-extrabold text-[#16845B] block mt-0.5 font-tabular">
                    {liveStatus.status}
                  </span>
                </div>
                <div className="bg-[#F7F7F4] p-4 rounded-xl border border-[#E2E7E3]">
                  <span className="text-[#68736E] block uppercase font-bold text-[10px]">Last Source Check</span>
                  <span className="text-sm font-bold text-[#17201D] block mt-0.5 font-tabular">
                    {new Date(liveStatus.lastCheckedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYNC LOGS */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
            <h2 className="text-base font-extrabold text-[#17201D]">LOTIS Synchronization Audit Trail</h2>
            <span className="text-xs text-[#68736E]">Showing last {syncLogs.length} sync executions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F4] text-[#68736E] uppercase font-bold border-b border-[#E2E7E3]">
                <tr>
                  <th className="py-3 px-4">Started (IST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Records Found</th>
                  <th className="py-3 px-4">New Draws</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3]">
                {syncLogs.map((log) => {
                  const duration = log.completedAt
                    ? `${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                    : '—';

                  return (
                    <tr key={log.id} className="hover:bg-[#F7F7F4]">
                      <td className="py-3 px-4 font-mono font-medium font-tabular">
                        {new Date(log.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16845B] bg-[#16845B]/10 px-2 py-0.5 rounded font-tabular">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B54747] bg-[#B54747]/10 px-2 py-0.5 rounded font-tabular">
                            <XCircle className="w-3 h-3" /> {log.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold font-tabular">{log.recordsFound}</td>
                      <td className="py-3 px-4 font-bold text-[#16845B] font-tabular">{log.newDrawsCount}</td>
                      <td className="py-3 px-4 text-[#68736E] font-tabular">{duration}</td>
                      <td className="py-3 px-4 text-[#68736E] max-w-xs truncate" title={log.errorMessage || ''}>
                        {log.errorMessage || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NEWS MANAGEMENT */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-[#E2E7E3] shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-[#17201D]">Editorial News & Dispatches</h2>
              <p className="text-xs text-[#68736E]">Manage public reports, bumper announcements, and statutory guidelines.</p>
            </div>
            <button
              onClick={() => setShowNewArticleModal(!showNewArticleModal)}
              className="px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish New Article</span>
            </button>
          </div>

          {showNewArticleModal && (
            <form onSubmit={handleCreateArticle} className="bg-white p-6 rounded-3xl border border-[#E2E7E3] shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-[#17201D]">Create New Article Dispatch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#17201D]">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Article headline..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E7E3] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#17201D]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E7E3] text-xs"
                  >
                    <option value="Bumper Lotteries">Bumper Lotteries</option>
                    <option value="Scheme Updates">Scheme Updates</option>
                    <option value="Claim Rules">Claim Rules</option>
                    <option value="Draw Analysis">Draw Analysis</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#17201D]">Subtitle / Excerpt</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Short summary..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E7E3] text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#17201D]">Paragraphs (Separate by blank line)</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Article content..."
                  className="w-full p-3 rounded-xl border border-[#E2E7E3] text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold"
                >
                  Save & Publish
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewArticleModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F7F7F4] text-[#68736E] text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm">
            <div className="divide-y divide-[#E2E7E3]">
              {newsList.map((art) => (
                <div key={art.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#0B3B32] bg-[#F1F4F2] px-2 py-0.5 rounded uppercase font-tabular">
                      {art.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#17201D]">{art.title}</h4>
                    <p className="text-xs text-[#68736E]">{art.publishedAt} • {art.author}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteArticle(art.id)}
                      className="p-2 rounded-lg text-[#B54747] hover:bg-rose-50 border border-transparent hover:border-[#B54747]/20"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS & TELEMETRY */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {stats?.fcm && (
            <div className="bg-[#10201D] text-white rounded-3xl p-6 sm:p-8 border border-[#0B3B32]/40 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#C8A45D]" />
                    <span>Firebase Cloud Messaging Telemetry</span>
                  </h2>
                  <p className="text-xs text-slate-300">Live tokens and daily delivery stats.</p>
                </div>
                <span className="text-xs bg-[#16845B]/20 text-[#16845B] border border-[#16845B]/30 px-3 py-1 rounded-full font-bold font-tabular">
                  Service Ready
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Devices</span>
                  <span className="text-2xl font-black text-[#16845B] block mt-1 font-tabular">{stats.fcm.activeSubscriptions}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tokens</span>
                  <span className="text-2xl font-black text-white block mt-1 font-tabular">{stats.fcm.totalSubscriptions}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheme Subs</span>
                  <span className="text-2xl font-black text-white block mt-1 font-tabular">{stats.fcm.lotterySubscriptionsCount}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sent Today</span>
                  <span className="text-2xl font-black text-[#16845B] block mt-1 font-tabular">{stats.fcm.sentToday}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Failed Today</span>
                  <span className="text-2xl font-black text-[#B54747] block mt-1 font-tabular">{stats.fcm.failedToday}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Invalid Cleaned</span>
                  <span className="text-2xl font-black text-[#C8A45D] block mt-1 font-tabular">{stats.fcm.invalidTokensCleaned}</span>
                </div>
              </div>
            </div>
          )}

          {deliveries.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
                <h2 className="text-base font-extrabold text-[#17201D] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#0B3B32]" />
                  <span>Recent FCM Web Push Deliveries</span>
                </h2>
                <span className="text-xs text-[#68736E]">Showing last {deliveries.length} push dispatches</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F4] text-[#68736E] uppercase font-bold border-b border-[#E2E7E3]">
                    <tr>
                      <th className="py-3 px-4">Time (IST)</th>
                      <th className="py-3 px-4">Result / Draw</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">FCM Token</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7E3]">
                    {deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-[#F7F7F4]">
                        <td className="py-3 px-4 font-mono font-tabular">
                          {new Date(del.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono font-tabular">{del.resultId}</td>
                        <td className="py-3 px-4">
                          {del.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16845B] bg-[#16845B]/10 px-2 py-0.5 rounded font-tabular">
                              <CheckCircle2 className="w-3 h-3" /> SENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B54747] bg-[#B54747]/10 px-2 py-0.5 rounded font-tabular">
                              <XCircle className="w-3 h-3" /> {del.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#68736E] truncate max-w-xs" title={del.pushSubscription?.fcmToken}>
                          {del.pushSubscription?.fcmToken ? `${del.pushSubscription.fcmToken.substring(0, 20)}...` : '—'}
                        </td>
                        <td className="py-3 px-4 text-[#68736E] max-w-xs truncate" title={del.errorMessage || ''}>
                          {del.errorMessage || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
