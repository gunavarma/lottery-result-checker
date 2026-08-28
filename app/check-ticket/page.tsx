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
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
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
        setErrorMsg(json.error || 'Ticket verification failed.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to verification server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const matchCount = checkResults?.filter((r) => r.isMatch).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Ticket Checker' }]} />

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
            Official Winning Number Verification
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Check Your Kerala Lottery Ticket
        </h1>
        <p className="text-sm text-slate-600">
          Verify your ticket number against verified official LOTIS results from the Directorate of Kerala State Lotteries.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'single'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Ticket
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'bulk'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Multiple Tickets (Bulk)
          </button>
        </div>

        <form onSubmit={handleCheckTickets} className="space-y-6">
          {/* Scheme & Draw Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Lottery Scheme (Optional)
              </label>
              <select
                value={selectedLottery}
                onChange={(e) => setSelectedLottery(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">All Schemes (Auto-Detect)</option>
                {lotteries.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} ({lot.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Draw Number (e.g. KN-638, SS-534)
              </label>
              <input
                type="text"
                value={drawNumber}
                onChange={(e) => setDrawNumber(e.target.value)}
                placeholder="Optional: e.g. KN-638"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Ticket Input Fields */}
          {mode === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Series (e.g. PS, PN)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  placeholder="e.g. PS"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 font-mono font-bold text-base text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Ticket Number (6 Digits or 4 Ending Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 320327 or 0266"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 font-mono font-bold text-base text-slate-900 tracking-wider focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Paste Multiple Tickets (One per line)
                </label>
                <span className="text-xs text-slate-400">Up to 25 tickets</span>
              </div>
              <textarea
                rows={5}
                value={bulkTickets}
                onChange={(e) => setBulkTickets(e.target.value)}
                placeholder={"PS 320327\nPN 320327\n0266\n0933\n5676"}
                className="w-full p-4 rounded-2xl border border-slate-300 bg-slate-50 font-mono text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Against Official LOTIS Database...</span>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                <span>Check Ticket{mode === 'bulk' ? 's' : ''}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {checkResults && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Banner */}
          <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-3xl">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
                Verification Summary
              </span>
              <h2 className="text-2xl font-black mt-0.5">
                {matchCount > 0 ? `🎉 ${matchCount} Prize Match Found!` : '⚪ No Match Found'}
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
                className={`p-6 rounded-3xl border transition-all ${
                  result.isMatch
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-300 shadow-md'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.isMatch ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>PRIZE MATCH</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>NO MATCH</span>
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-slate-500">
                        Input: {result.inputTicket}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {result.normalizedDisplay || result.inputTicket}
                      </span>
                    </div>
                  </div>

                  {result.isMatch ? (
                    <div className="bg-emerald-600 text-white p-4 rounded-2xl text-center sm:text-right shrink-0 min-w-[200px] shadow-sm">
                      <span className="text-xs uppercase font-bold text-emerald-100 block">
                        {result.prizeCategory}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black block mt-0.5">
                        {result.prizeAmountFormatted}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 max-w-xs">
                      {result.message}
                    </p>
                  )}
                </div>

                {result.isMatch && (
                  <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-600 space-y-0.5">
                      <p>
                        Lottery: <strong>{result.lotteryName}</strong> ({result.drawNumber}) • Draw Date: <strong>{result.drawDate}</strong>
                      </p>
                      {result.location && (
                        <p>Winning Location: <strong>📍 {result.location}</strong></p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleCopy(result.normalizedDisplay, idx)}
                        className="text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>

                      <Link
                        href={result.resultUrl}
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-2xs"
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

          {/* Legal Disclaimer Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Important Prize Verification Notice:</p>
            <p>
              Winning-number match indication is provided for informational convenience only. Final prize eligibility and claims are subject to official verification of the physical ticket by the Directorate of Kerala State Lotteries within 90 days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
