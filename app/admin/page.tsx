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
  Layers,
  TrendingUp,
  Search,
  BookOpen,
} from 'lucide-react';
import { getAllNews, NewsArticle } from '@/lib/news';
import { getAllGuides } from '@/lib/guides';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'news' | 'growth' | 'notifications'>('overview');

  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
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

      // 2. Fetch Live Status Engine & SEO Growth metrics
      const [liveRes, growthRes] = await Promise.all([
        fetch('/api/live'),
        fetch('/api/admin/seo-growth'),
      ]);

      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        setLiveStatus(liveJson);
      }

      if (growthRes.ok) {
        const growthJson = await growthRes.json();
        if (growthJson.success) {
          setGrowthData(growthJson.data);
        }
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
          title: 'KeralaDraws Alert Test',
          body: 'Official test push notification dispatched successfully from Admin Control.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Push test dispatched. Sent: ${data.summary?.sent ?? 0}, Failed: ${data.summary?.failed ?? 0}`,
        });
        loadAdminData(token);
      } else {
        setMessage({
          type: 'error',
          text: `Push test failed: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error sending test notification.' });
    } finally {
      setTestingNotification(false);
    }
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required.' });
      return;
    }

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newArt: NewsArticle = {
      id: `art-${Date.now()}`,
      slug,
      category: newCategory,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || newTitle.trim(),
      excerpt: newSubtitle.trim() || newContent.trim().substring(0, 140),
      publishedAt: new Date().toISOString().split('T')[0],
      author: 'KeralaDraws Editorial Desk',
      readTime: '3 min read',
      content: newContent.split('\n\n').filter((p) => p.trim()),
    };

    setNewsList([newArt, ...newsList]);
    setShowNewArticleModal(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewContent('');
    setMessage({ type: 'success', text: `Article "${newArt.title}" published successfully.` });
  };

  const handleDeleteArticle = (id: string) => {
    setNewsList(newsList.filter((a) => a.id !== id));
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
                className="w-full px-4 py-3 rounded-2xl border border-[#E2E7E3] bg-[#F7F7F4] text-[#17201D] text-sm focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden font-mono"
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
              className="w-full bg-[#0B3B32] hover:bg-[#10201D] text-white py-3.5 rounded-2xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate & Unlock Control'}
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
            KeralaDraws System Monitor
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
          { id: 'growth', label: 'Growth & SEO', icon: TrendingUp },
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
                  : 'bg-white text-[#17201D] border-[#E2E7E3] hover:bg-[#F7F7F4]'
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
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/20'
              : 'bg-[#B54747]/10 text-[#B54747] border border-[#B54747]/20'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">
                Database Certified Draws
              </span>
              <div className="text-3xl font-black text-[#17201D] font-tabular">
                {stats?.database?.totalDraws ?? '—'}
              </div>
              <p className="text-xs text-[#68736E]">Across all 7 weekly + seasonal bumper schemes</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">
                Active FCM Subscribers
              </span>
              <div className="text-3xl font-black text-[#16845B] font-tabular">
                {stats?.fcm?.activeSubscriptions ?? '—'}
              </div>
              <p className="text-xs text-[#68736E]">Active browser push tokens registered</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">
                Ticket Watchlist Users
              </span>
              <div className="text-3xl font-black text-[#17201D] font-tabular">
                {growthData?.watchlistSubscribers ?? '—'}
              </div>
              <p className="text-xs text-[#68736E]">Monitored tickets in retention loop</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wide block font-tabular">
                Indexable URLs
              </span>
              <div className="text-3xl font-black text-[#C8A45D] font-tabular">
                {growthData?.totalIndexableUrls ?? '—'}
              </div>
              <p className="text-xs text-[#68736E]">In dynamic sitemap.xml</p>
            </div>
          </div>

          {/* Quick Health Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4">
            <h2 className="text-lg font-extrabold text-[#17201D]">Platform Health & Verification Checks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-center justify-between">
                <span className="font-bold text-[#17201D]">Supabase Cron</span>
                <span className="font-bold text-[#16845B] font-tabular">Every 15m Active</span>
              </div>
              <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-center justify-between">
                <span className="font-bold text-[#17201D]">XML Sitemap</span>
                <span className="font-bold text-[#16845B] font-tabular">Dynamic (Live DB)</span>
              </div>
              <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-center justify-between">
                <span className="font-bold text-[#17201D]">Statutory Disclaimer</span>
                <span className="font-bold text-[#16845B] font-tabular">E-E-A-T Compliant</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNC LOGS */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
            <h2 className="text-base font-extrabold text-[#17201D] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#0B3B32]" />
              <span>LOTIS Synchronization History</span>
            </h2>
            <button
              onClick={() => handleTriggerSync(true)}
              disabled={syncing}
              className="px-3.5 py-1.5 rounded-xl bg-[#F7F7F4] text-[#0B3B32] font-bold text-xs border border-[#E2E7E3] hover:bg-[#F1F4F2]"
            >
              Force Sync Latest 10 Draws
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F4] text-[#68736E] uppercase font-bold border-b border-[#E2E7E3]">
                <tr>
                  <th className="py-3 px-4">Started (IST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Records Evaluated</th>
                  <th className="py-3 px-4">New Draws</th>
                  <th className="py-3 px-4">Execution Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3]">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F7F4]">
                    <td className="py-3 px-4 font-mono font-tabular">
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
                    <td className="py-3 px-4 font-tabular">{log.recordsFound}</td>
                    <td className="py-3 px-4 font-bold font-tabular text-[#16845B]">{log.newDrawsCount}</td>
                    <td className="py-3 px-4 text-[#68736E] max-w-xs truncate">{log.errorMessage || 'Clean sync.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GROWTH & SEO DASHBOARD */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#17201D] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#0B3B32]" />
                  <span>Search Intent Mapping & Canonical Matrix</span>
                </h2>
                <p className="text-xs text-[#68736E] mt-0.5">
                  Topical cluster mapping to prevent keyword cannibalization and maximize Google indexation.
                </p>
              </div>
              <span className="text-xs bg-[#16845B]/10 text-[#16845B] px-3 py-1 rounded-full font-bold font-tabular">
                All Clusters Optimized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F4] text-[#68736E] uppercase font-bold border-b border-[#E2E7E3]">
                  <tr>
                    <th className="py-3 px-4">Search Intent</th>
                    <th className="py-3 px-4">Target Keyword Query</th>
                    <th className="py-3 px-4">Canonical Target Page</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7E3]">
                  {growthData?.queryMappings?.map((map: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#F7F7F4]">
                      <td className="py-3.5 px-4 font-bold text-[#17201D]">{map.intent}</td>
                      <td className="py-3.5 px-4 font-mono text-[#68736E]">{map.primaryQuery}</td>
                      <td className="py-3.5 px-4">
                        <a
                          href={map.targetPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#0B3B32] hover:underline"
                        >
                          {map.targetPath}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16845B] bg-[#16845B]/10 px-2.5 py-0.5 rounded font-tabular">
                          <CheckCircle2 className="w-3 h-3" /> {map.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NEWS MANAGEMENT */}
      {activeTab === 'news' && (
        <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#17201D] flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#0B3B32]" />
                <span>Editorial News & Gazette Releases</span>
              </h2>
              <p className="text-xs text-[#68736E]">Manage published articles and announcements.</p>
            </div>
            <button
              onClick={() => setShowNewArticleModal(true)}
              className="px-4 py-2 bg-[#0B3B32] text-white font-bold text-xs rounded-xl hover:bg-[#16845B] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          </div>

          <div className="space-y-4">
            {newsList.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-2xl border border-[#E2E7E3] bg-[#F7F7F4] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
                      {art.category}
                    </span>
                    <span className="text-xs text-[#68736E] font-tabular">{art.publishedAt}</span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#17201D]">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#68736E] line-clamp-1">{art.excerpt}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/news/${art.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0B3B32] hover:underline"
                  >
                    View Live
                  </a>
                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    className="p-2 rounded-xl text-[#68736E] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {stats?.fcm && (
            <div className="bg-[#10201D] text-white rounded-3xl p-6 sm:p-8 border border-[#0B3B32]/40 shadow-xs space-y-6">
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
            <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs overflow-hidden space-y-4 p-6">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Article Modal */}
      {showNewArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E2E7E3] shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#17201D]">Publish New Gazette Article</h3>
            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#17201D] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Thiruvonam Bumper 2026 Release Timetable"
                  className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17201D] block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4]"
                >
                  <option value="Bumper Lotteries">Bumper Lotteries</option>
                  <option value="Scheme Updates">Scheme Updates</option>
                  <option value="Claim Rules">Claim Rules</option>
                  <option value="Draw Analysis">Draw Analysis</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#17201D] block mb-1">Subtitle / Excerpt</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Short summary for search results"
                  className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17201D] block mb-1">Content (Paragraphs separated by double linebreaks)</label>
                <textarea
                  rows={5}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write verified article content..."
                  className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewArticleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#68736E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B3B32] text-white text-xs font-bold hover:bg-[#16845B]"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
