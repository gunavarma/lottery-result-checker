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
  Loader2
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
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Check Ticket' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Official Winning Number Verification
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Check Your Kerala Lottery Ticket
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Verify your ticket number against verified official LOTIS results from the Directorate of Kerala State Lotteries.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 p-1 bg-[#F7F7F4] rounded-2xl w-fit border border-[#E2E7E3]">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'single'
                ? 'bg-white text-[#0B3B32] shadow-xs'
                : 'text-[#68736E] hover:text-[#17201D]'
            }`}
          >
            Single Ticket
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'bulk'
                ? 'bg-white text-[#0B3B32] shadow-xs'
                : 'text-[#68736E] hover:text-[#17201D]'
            }`}
          >
            Multiple Tickets (Bulk)
          </button>
        </div>

        <form onSubmit={handleCheckTickets} className="space-y-6">
          {/* Scheme & Draw Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                Lottery Scheme (Optional)
              </label>
              <select
                value={selectedLottery}
                onChange={(e) => setSelectedLottery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none"
              >
                <option value="">All Schemes (Auto-Detect)</option>
                {lotteries.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} ({lot.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                Draw Number (e.g. KN-638, SS-534)
              </label>
              <input
                type="text"
                value={drawNumber}
                onChange={(e) => setDrawNumber(e.target.value)}
                placeholder="Optional: e.g. KN-638"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none"
              />
            </div>
          </div>

          {/* Ticket Input Fields */}
          {mode === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                  Series (e.g. PS, PN)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  placeholder="e.g. PS"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono font-bold text-sm text-[#17201D] uppercase focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none font-tabular"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                  Ticket Number (6 Digits or 4 Ending Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 320327 or 0266"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono font-bold text-sm text-[#17201D] tracking-wider focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none font-tabular"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
                  Paste Multiple Tickets (One per line)
                </label>
                <span className="text-xs text-[#68736E]">Up to 25 tickets</span>
              </div>
              <textarea
                rows={5}
                value={bulkTickets}
                onChange={(e) => setBulkTickets(e.target.value)}
                placeholder={"PS 320327\nPN 320327\n0266\n0933\n5676"}
                className="w-full p-4 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] font-mono text-xs text-[#17201D] focus:bg-white focus:ring-2 focus:ring-[#0B3B32] focus:outline-none font-tabular"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-[#B54747]/10 border border-[#B54747]/30 text-xs font-semibold text-[#B54747] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-tabular"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Against Official LOTIS Database...</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 text-[#C8A45D]" />
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
                    ? 'bg-white border-[#16845B]/50 shadow-md'
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
                      <span className="text-2xl font-black font-mono text-[#17201D] font-tabular">
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
                    <p className="text-xs text-[#68736E] max-w-xs">
                      {result.message}
                    </p>
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
                        className="px-4 py-2 rounded-xl bg-[#0B3B32] text-white font-bold hover:bg-[#16845B] transition-colors flex items-center gap-1 shadow-xs"
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
          <div className="p-4 rounded-2xl bg-white border border-[#E2E7E3] text-xs text-[#68736E] space-y-1">
            <p className="font-bold text-[#17201D]">Important Prize Verification Notice:</p>
            <p>
              Winning-number match indication is provided for informational convenience only. Final prize eligibility and claims are subject to official verification of the physical ticket by the Directorate of Kerala State Lotteries within 90 days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
