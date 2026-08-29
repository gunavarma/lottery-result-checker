'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Award,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';

interface TicketCheckerProps {
  initialLotteryId?: string;
  initialDrawNumber?: string;
}

export function TicketChecker({ initialLotteryId, initialDrawNumber }: TicketCheckerProps) {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [selectedLottery, setSelectedLottery] = useState(initialLotteryId || 'all');
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLotteries() {
      try {
        const res = await fetch('/api/lotteries');
        const json = await res.json();
        if (json.success && json.lotteries) {
          setLotteries(json.lotteries);
        }
      } catch (e) {
        console.error('Error fetching lotteries for checker:', e);
      }
    }
    fetchLotteries();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const query = ticketInput.trim();
    if (!query) {
      setErrorMsg('Please enter a ticket number.');
      return;
    }
    if (query.length < 3) {
      setErrorMsg('Ticket number must be at least 3 digits.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();

      if (json.success && json.results?.winningTickets) {
        let winningMatches = json.results.winningTickets;
        if (selectedLottery !== 'all') {
          winningMatches = winningMatches.filter(
            (t: any) => t.prize?.draw?.lotteryId === selectedLottery
          );
        }
        setResults(winningMatches);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Ticket check error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTicketInput('');
    setResults(null);
    setHasSearched(false);
    setErrorMsg(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Financial Lookup Tool
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
          Check Your Ticket
        </h2>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Find out whether your ticket matches a published winning number in official records.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleCheck} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Scheme Selection */}
          <div className="sm:col-span-4 space-y-1.5">
            <label htmlFor="lottery-scheme-select" className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
              Lottery Scheme
            </label>
            <select
              id="lottery-scheme-select"
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] transition-colors"
            >
              <option value="all">All Active Schemes</option>
              {lotteries.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} ({lot.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Number Input */}
          <div className="sm:col-span-8 space-y-1.5">
            <label htmlFor="ticket-number-input" className="block text-xs font-bold text-[#17201D] uppercase tracking-wide">
              Ticket Number
            </label>
            <div className="flex gap-2">
              <input
                id="ticket-number-input"
                type="text"
                placeholder="e.g. 320327, PS 320327, 0266"
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] text-sm sm:text-base text-[#17201D] font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-[#68736E]"
              />
              <button
                type="submit"
                disabled={loading || ticketInput.trim().length < 3}
                className="px-6 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 font-tabular"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Check Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-[#B54747]">{errorMsg}</p>
        )}

        <p className="text-[11px] text-[#68736E] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />
          <span>Checks directly against published official Kerala Government LOTIS results.</span>
        </p>
      </form>

      {/* Results View */}
      {hasSearched && (
        <div className="pt-6 border-t border-[#E2E7E3] animate-fadeIn space-y-4">
          {results && results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#16845B]/10 border border-[#16845B]/30 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#16845B]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Winning ticket record found for "{ticketInput}"!</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#0B3B32] font-bold hover:underline"
                >
                  Check Another Ticket
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((r: any, idx: number) => {
                  const prize = r.prize;
                  const draw = prize?.draw;
                  const lottery = draw?.lottery;
                  const drawDateFormatted = draw?.drawDate?.split('T')[0];

                  return (
                    <div
                      key={idx}
                      className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-5 space-y-3 hover:border-[#0B3B32]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B3B32] uppercase font-tabular">
                          {lottery?.name || 'Kerala Lottery'}
                        </span>
                        <span className="text-xs font-mono font-bold bg-white border border-[#E2E7E3] px-2 py-0.5 rounded text-[#17201D]">
                          {draw?.drawNumber}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs text-[#68736E] block font-medium">
                            {prize?.category}
                          </span>
                          <span className="text-2xl font-black text-[#17201D] font-mono tracking-wider font-tabular">
                            {r.displayNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[#68736E] block font-medium">
                            Prize Amount
                          </span>
                          <span className="text-lg font-black text-[#16845B] font-tabular">
                            {formatINR(prize?.amount)}
                          </span>
                        </div>
                      </div>

                      {r.location && (
                        <p className="text-xs text-[#68736E]">
                          Agent District: <strong className="text-[#17201D]">{r.location}</strong>
                        </p>
                      )}

                      <div className="pt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs">
                        <span className="text-[#68736E]">
                          Draw Date: {drawDateFormatted}
                        </span>
                        <Link
                          href={`/result/${drawDateFormatted}/${lottery?.slug}`}
                          className="font-bold text-[#0B3B32] hover:text-[#16845B] flex items-center gap-1 transition-colors"
                        >
                          <span>View Full Result</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#17201D]">
                <AlertCircle className="w-4 h-4 text-[#68736E]" />
                <span>No matching prize found for "{ticketInput}"</span>
              </div>
              <p className="text-xs text-[#68736E] max-w-md mx-auto leading-relaxed">
                This ticket number does not match any currently published winning numbers in the database. Please verify the ticket series and digits against the complete prize table.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F1F4F2] text-xs font-bold text-[#17201D] transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#68736E]" />
                  <span>Check Another Ticket</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
