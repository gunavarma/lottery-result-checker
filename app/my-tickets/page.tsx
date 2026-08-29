'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NotificationModal } from '@/components/NotificationModal';
import {
  Ticket,
  Plus,
  Trash2,
  Bell,
  CheckCircle2,
  Clock,
  Award,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';

export default function MyTicketsPage() {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // New ticket form state
  const [selectedLottery, setSelectedLottery] = useState('');
  const [series, setSeries] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getDeviceId = () => {
    if (typeof window === 'undefined') return 'anonymous-device';
    let id = localStorage.getItem('kd_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kd_device_id', id);
    }
    return id;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const devId = getDeviceId();
      const [lotteriesRes, ticketsRes] = await Promise.all([
        fetch('/api/lotteries'),
        fetch(`/api/tickets/watchlist?userId=${devId}`),
      ]);

      if (lotteriesRes.ok) {
        const lotData = await lotteriesRes.json();
        setLotteries(lotData.lotteries || []);
        if (lotData.lotteries?.length > 0 && !selectedLottery) {
          setSelectedLottery(lotData.lotteries[0].id);
        }
      }

      if (ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setTickets(tData.tickets || []);
      }
    } catch (e) {
      console.error('Error loading my tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const cleanNum = ticketNumber.replace(/\D/g, '');

    if (!cleanNum || cleanNum.length < 4) {
      setMessage({ type: 'error', text: 'Please enter a valid ticket number (at least 4 digits).' });
      return;
    }

    setSaving(true);
    try {
      const devId = getDeviceId();
      const res = await fetch('/api/tickets/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: cleanNum,
          series: series.trim() ? series.toUpperCase().trim() : null,
          lotteryId: selectedLottery,
          userId: devId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Ticket successfully saved to your watchlist.' });
        setTicketNumber('');
        setSeries('');
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save ticket.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error saving ticket.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/watchlist?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'My Saved Tickets' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Ticket Monitoring Watchlist
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
            My Saved Tickets
          </h1>
          <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl mt-1">
            Store your Kerala lottery tickets locally to automatically monitor winning status against official 3:00 PM certified results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifyModal(true)}
            className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Bell className="w-4 h-4 text-[#C8A45D]" />
            <span>Enable Draw Alerts</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F7F7F4] text-[#17201D] transition-colors"
            title="Refresh Watchlist"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0B3B32]' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Add Ticket Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E2E7E3] shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-[#17201D] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0B3B32]" />
              <span>Add Ticket to Watchlist</span>
            </h2>

            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/20'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleAddTicket} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#17201D] block">Select Lottery Scheme</label>
                <select
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value)}
                  className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                >
                  {lotteries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code}) • {l.drawDay}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1.5">
                  <label className="font-bold text-[#17201D] block">Series</label>
                  <input
                    type="text"
                    placeholder="e.g. PS"
                    maxLength={3}
                    value={series}
                    onChange={(e) => setSeries(e.target.value.toUpperCase())}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3 py-2.5 text-xs text-[#17201D] uppercase font-mono font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="font-bold text-[#17201D] block">Ticket Number</label>
                  <input
                    type="text"
                    placeholder="6 digits (e.g. 320327)"
                    maxLength={6}
                    required
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs text-[#17201D] font-mono font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#0B3B32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#0B3B32] hover:bg-[#10201D] text-white py-3 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Monitor Ticket'}</span>
              </button>
            </form>
          </div>

          <div className="bg-[#F7F7F4] p-5 rounded-3xl border border-[#E2E7E3] space-y-2 text-xs text-[#68736E]">
            <span className="font-bold text-[#17201D] block uppercase font-tabular">
              Watchlist Security & Privacy
            </span>
            <p>
              Your saved tickets are stored securely on your browser device. KeralaDraws does not request personal identities, phone numbers, or credit card numbers.
            </p>
          </div>
        </div>

        {/* Right Col: Monitored Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#17201D]">
              Active Monitored Tickets ({tickets.length})
            </h2>
            <Link
              href="/check-ticket"
              className="text-xs font-bold text-[#0B3B32] hover:underline flex items-center gap-1"
            >
              <span>Instant Checker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0B3B32] mx-auto" />
              <p className="text-xs text-[#68736E]">Evaluating saved tickets against certified records...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6 text-[#C8A45D]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#17201D]">No Monitored Tickets Yet</h3>
                <p className="text-xs text-[#68736E] max-w-sm mx-auto">
                  Add your purchased lottery ticket numbers on the left to monitor their draw results automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const fullTicketDisplay = t.series ? `${t.series} ${t.ticketNumber}` : t.ticketNumber;
                const hasWon = !!t.matchResult;

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      hasWon
                        ? 'border-[#16845B] bg-[#16845B]/5 ring-1 ring-[#16845B]/20'
                        : 'border-[#E2E7E3] hover:border-[#0B3B32]/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2 py-0.5 rounded border border-[#E2E7E3]">
                          {t.lotteryCode}
                        </span>
                        <span className="text-xs font-bold text-[#17201D]">
                          {t.lotteryName}
                        </span>
                        {t.latestDrawNumber && (
                          <span className="text-[11px] text-[#68736E] font-tabular">
                            (Draw: {t.latestDrawNumber})
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-3 pt-1">
                        <span className="text-xl font-black font-mono tracking-wider text-[#17201D]">
                          {fullTicketDisplay}
                        </span>

                        {hasWon ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16845B] bg-[#16845B]/10 px-2.5 py-0.5 rounded-full font-tabular">
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {t.matchResult.prizeCategory} ({formatINR(t.matchResult.prizeAmount)})
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#68736E] bg-[#F7F7F4] px-2 py-0.5 rounded-full font-tabular">
                            <Clock className="w-3 h-3 text-[#C8A45D]" />
                            <span>Active Monitoring</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <Link
                        href={`/lotteries/${t.lotterySlug}`}
                        className="text-xs font-bold text-[#0B3B32] hover:underline"
                      >
                        View Results
                      </Link>

                      <button
                        onClick={() => handleDeleteTicket(t.id)}
                        className="p-2 rounded-xl text-[#68736E] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove from Watchlist"
                        aria-label="Remove ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showNotifyModal && (
        <NotificationModal onClose={() => setShowNotifyModal(false)} />
      )}
    </div>
  );
}
