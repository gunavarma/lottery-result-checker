'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Loader2,
  Bookmark,
  Bell,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export default function CheckTicketPage() {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<string>('');
  const [drawNumber, setDrawNumber] = useState<string>('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single ticket state
  const [series, setSeries] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');

  // Bulk tickets state
  const [bulkTickets, setBulkTickets] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<any[] | null>(null);
  const [drawsEvaluated, setDrawsEvaluated] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedTicketMsg, setSavedTicketMsg] = useState<string | null>(null);

  // Load lottery schemes for dropdown
  useEffect(() => {
    fetch('/api/lotteries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lotteries) {
          setLotteries(data.lotteries);
        }
      })
      .catch((err) => console.warn('Failed to load lotteries for dropdown:', err));
  }, []);

  const handleCheckTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCheckResults(null);
    setSavedTicketMsg(null);

    let ticketsToVerify: string[] = [];

    if (mode === 'single') {
      const trimmedNum = ticketNumber.trim();
      if (!trimmedNum || trimmedNum.length < 4) {
        setErrorMsg('Please enter at least 4 digits of your ticket number.');
        return;
      }
      const combined = series.trim() ? `${series.trim().toUpperCase()} ${trimmedNum}` : trimmedNum;
      ticketsToVerify = [combined];
    } else {
      const lines = bulkTickets
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 4);

      if (lines.length === 0) {
        setErrorMsg('Please enter at least one valid ticket number (4 to 6 digits).');
        return;
      }

      if (lines.length > 25) {
        setErrorMsg('You can check up to 25 tickets at once. Please shorten the list.');
        return;
      }

      ticketsToVerify = lines;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tickets/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotteryId: selectedLottery || undefined,
          drawNumber: drawNumber.trim() || undefined,
          tickets: ticketsToVerify,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCheckResults(json.results);
        setDrawsEvaluated(json.drawsEvaluated || []);
      } else {
        setErrorMsg(json.error || 'Failed to check tickets.');
      }
    } catch (err) {
      setErrorMsg('Network error while checking tickets. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToWatchlist = async (ticketStr: string) => {
    try {
      const parts = ticketStr.trim().split(/\s+/);
      let s: string | null = null;
      let num = ticketStr.replace(/\D/g, '');

      if (parts.length > 1 && parts[0].length <= 3) {
        s = parts[0].toUpperCase();
        num = parts[1].replace(/\D/g, '');
      }

      const devId = localStorage.getItem('kd_device_id') || 'dev_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('kd_device_id', devId);

      const lotId = selectedLottery || lotteries[0]?.id;
      if (!lotId) return;

      const res = await fetch('/api/tickets/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: num,
          series: s,
          lotteryId: lotId,
          userId: devId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedTicketMsg(`Ticket ${ticketStr} saved to your Watchlist.`);
        setTimeout(() => setSavedTicketMsg(null), 4000);
      }
    } catch (e) {
      console.error('Error saving ticket:', e);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const matchCount = checkResults?.filter((r) => r.isMatch).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Ticket Checker' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Instant Winning Verification
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
            Kerala Lottery Ticket Checker
          </h1>
          <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl">
            Check your single or bulk Kerala lottery numbers against certified official LOTIS results across 1st prize, consolation series, and 2nd to 8th ending digits.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/my-tickets"
            className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span>My Saved Tickets</span>
          </Link>
          <Link
            href="/guides/how-to-check-kerala-lottery-ticket"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#C8A45D]" />
            <span>How to Check</span>
          </Link>
        </div>
      </div>

      {/* Main Checker Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6">
        {/* Mode Selector */}
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'single'
                  ? 'bg-[#0B3B32] text-white shadow-xs'
                  : 'bg-[#F7F7F4] text-[#68736E] hover:text-[#17201D]'
              }`}
            >
              Single Ticket
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'bulk'
                  ? 'bg-[#0B3B32] text-white shadow-xs'
                  : 'bg-[#F7F7F4] text-[#68736E] hover:text-[#17201D]'
              }`}
            >
              Bulk Check (Up to 25)
            </button>
          </div>

          <span className="text-[11px] text-[#68736E] hidden sm:inline-block">
            Supports 6-digit tickets & 4-digit ending numbers
          </span>
        </div>

        <form onSubmit={handleCheckTickets} className="space-y-6">
          {/* Lottery Scheme & Draw Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block">
                Select Lottery Scheme (Optional)
              </label>
              <select
                value={selectedLottery}
                onChange={(e) => setSelectedLottery(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden"
              >
                <option value="">All Active Lotteries (Automatic Search)</option>
                {lotteries.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code}) • {l.drawDay}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17201D] block">
                Draw Number (Optional)
              </label>
              <input
                type="text"
                value={drawNumber}
                onChange={(e) => setDrawNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KN-638, SK-67 (Leave blank for latest)"
                className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs text-[#17201D] uppercase font-mono focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Ticket Input Fields */}
          {mode === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-[#17201D] block">
                  Series (Optional)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  placeholder="e.g. PS"
                  className="w-full p-3.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono font-bold text-center text-sm uppercase text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-[#17201D] block">
                  Ticket Number (6 Digits or 4-digit Ending)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="Enter 4 to 6 digits (e.g. 320327 or 0266)"
                    className="w-full p-3.5 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono font-bold text-sm tracking-wider text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden"
                  />
                  <Ticket className="w-5 h-5 text-[#68736E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#17201D] block">
                  Enter Ticket Numbers (One per line)
                </label>
                <span className="text-[11px] text-[#68736E]">Max 25 tickets</span>
              </div>
              <textarea
                rows={5}
                value={bulkTickets}
                onChange={(e) => setBulkTickets(e.target.value)}
                placeholder={"PS 320327\nPN 320327\n0266\n0933\n5676"}
                className="w-full p-4 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono text-xs text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-hidden"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedTicketMsg && (
            <div className="p-4 rounded-2xl bg-[#16845B]/10 border border-[#16845B]/20 text-xs font-bold text-[#16845B] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedTicketMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-xl bg-[#0B3B32] hover:bg-[#10201D] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Against LOTIS Database...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-[#C8A45D]" />
                  <span>Check Ticket{mode === 'bulk' ? 's' : ''}</span>
                </>
              )}
            </button>

            {mode === 'single' && ticketNumber.length >= 4 && (
              <button
                type="button"
                onClick={() =>
                  handleSaveToWatchlist(
                    series.trim() ? `${series.toUpperCase().trim()} ${ticketNumber}` : ticketNumber
                  )
                }
                className="px-5 py-3.5 rounded-xl bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] font-bold text-xs transition-colors flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Ticket to Watchlist</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Section */}
      {checkResults && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="flex items-center justify-between bg-[#10201D] text-white p-6 rounded-3xl border border-[#0B3B32]/40">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C8A45D] font-bold block font-tabular">
                Verification Summary
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                {matchCount > 0 ? `${matchCount} Prize Match Found` : 'No Matching Prize Found'}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-300">
              <span>Evaluated {checkResults.length} ticket(s)</span>
            </div>
          </div>

          {/* Results Cards List */}
          <div className="grid grid-cols-1 gap-4">
            {checkResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border transition-all ${
                  result.isMatch
                    ? 'bg-white border-[#16845B] shadow-sm'
                    : 'bg-white border-[#E2E7E3]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#16845B]/10 text-[#16845B] px-2.5 py-0.5 rounded font-tabular">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PRIZE MATCH</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#F7F7F4] text-[#68736E] px-2.5 py-0.5 rounded font-tabular">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>NO MATCH</span>
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-[#68736E]">
                        Input: {result.inputTicket}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-2xl font-black font-mono text-[#17201D]">
                        {result.normalizedDisplay || result.inputTicket}
                      </span>
                    </div>
                  </div>

                  {result.isMatch ? (
                    <div className="bg-[#0B3B32] text-white p-4 rounded-xl text-center sm:text-right shrink-0 min-w-[200px] shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-[#C8A45D] block font-tabular">
                        {result.prizeCategory}
                      </span>
                      <span className="text-2xl font-black block mt-0.5 font-tabular text-[#16845B]">
                        {result.prizeAmountFormatted}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-[#68736E] max-w-xs">{result.message}</p>
                      <button
                        onClick={() => handleSaveToWatchlist(result.inputTicket)}
                        className="text-xs font-bold text-[#0B3B32] hover:underline shrink-0"
                      >
                        Save to Watchlist
                      </button>
                    </div>
                  )}
                </div>

                {result.isMatch && (
                  <div className="mt-4 pt-4 border-t border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-[#68736E] space-y-0.5">
                      <p>
                        Lottery: <strong>{result.lotteryName}</strong> ({result.drawNumber}) • Draw Date: <strong>{result.drawDate}</strong>
                      </p>
                      {result.location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C8A45D]" />
                          <span>Winning District: <strong>{result.location}</strong></span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleCopy(result.normalizedDisplay, idx)}
                        className="text-[#68736E] hover:text-[#0B3B32] font-semibold flex items-center gap-1"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-[#16845B]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy Number'}</span>
                      </button>

                      <Link
                        href={result.resultUrl}
                        className="px-4 py-2 rounded-xl bg-[#0B3B32] text-white font-bold hover:bg-[#10201D] transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>View Draw Result</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Guide & Rules Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[#17201D]">
            How Kerala Lottery Ticket Checking Works
          </h2>
          <p className="text-xs text-[#68736E]">
            Understanding ticket code matching rules across all official prize tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-[#17201D] leading-relaxed">
          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <span className="font-bold text-[#0B3B32] uppercase block font-tabular">1. First Prize & Series</span>
            <p className="text-[#68736E]">
              1st Prize requires both the 2-letter series code and all 6 digits to match exactly.
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <span className="font-bold text-[#0B3B32] uppercase block font-tabular">2. Consolation Series</span>
            <p className="text-[#68736E]">
              If all 6 digits match the 1st prize winning number but with different series letters, you win the Consolation Prize (₹8,000).
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <span className="font-bold text-[#0B3B32] uppercase block font-tabular">3. Lower Ending Tiers</span>
            <p className="text-[#68736E]">
              Prizes from 4th to 8th tiers are evaluated based on the last 4 digits, matching across all printed series.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
