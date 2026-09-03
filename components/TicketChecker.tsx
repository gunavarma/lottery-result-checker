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
  ShieldCheck,
  Camera,
  QrCode,
  Ticket,
  XCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { useLanguage } from '@/context/LanguageContext';
import { TicketScanner, ScannedTicket } from '@/components/lottery/TicketScanner';
import { useCheckTickets, TicketMatchResult } from '@/hooks/queries/useCheckTickets';

interface TicketCheckerProps {
  initialLotteryId?: string;
  initialDrawNumber?: string;
}

export function TicketChecker({ initialLotteryId, initialDrawNumber }: TicketCheckerProps) {
  const { t } = useLanguage();
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [selectedLottery, setSelectedLottery] = useState(initialLotteryId || 'all');
  const [ticketInput, setTicketInput] = useState('');
  const [singleResults, setSingleResults] = useState<any[] | null>(null);
  const [hasSearchedSingle, setHasSearchedSingle] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-Ticket Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [batchResults, setBatchResults] = useState<TicketMatchResult[] | null>(null);
  const [batchSummary, setBatchSummary] = useState<{
    total: number;
    winning: number;
    nonWinning: number;
  } | null>(null);

  const checkTicketsMutation = useCheckTickets();

  useEffect(() => {
    async function fetchLotteries() {
      try {
        const res = await fetch('/api/lotteries');
        const json = await res.json();
        if (json.success && json.lotteries) {
          setLotteries(json.lotteries);
        }
      } catch {
        // Fallback gracefully on network error
      }
    }
    fetchLotteries();
  }, []);

  // Single Ticket Manual Search
  const executeSingleSearch = async (query: string, lotteryId: string = selectedLottery) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMsg('Ticket number must be at least 3 digits.');
      return;
    }

    setSingleLoading(true);
    setHasSearchedSingle(true);
    setBatchResults(null);
    setBatchSummary(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();

      if (json.success && json.results?.winningTickets) {
        let winningMatches = json.results.winningTickets;
        if (lotteryId !== 'all') {
          winningMatches = winningMatches.filter(
            (t: any) => t.prize?.draw?.lotteryId === lotteryId
          );
        }
        setSingleResults(winningMatches);
      } else {
        setSingleResults([]);
      }
    } catch {
      setSingleResults([]);
    } finally {
      setSingleLoading(false);
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSingleSearch(ticketInput);
  };

  // Multi-Ticket Scanner Callback
  const handleTicketsScanned = (scanned: ScannedTicket[]) => {
    if (!scanned || scanned.length === 0) return;

    const ticketNumbers = scanned.map((t) => t.ticketNumber);

    // Trigger TanStack Query batch check mutation
    checkTicketsMutation.mutate(
      {
        tickets: ticketNumbers,
        lotteryId: selectedLottery !== 'all' ? selectedLottery : undefined,
      },
      {
        onSuccess: (data) => {
          if (data.results) {
            const winning = data.results.filter((r) => r.isMatch).length;
            const nonWinning = data.results.length - winning;

            setBatchResults(data.results);
            setBatchSummary({
              total: data.results.length,
              winning,
              nonWinning,
            });
            setHasSearchedSingle(false);
            setSingleResults(null);
          }
        },
        onError: (err) => {
          setErrorMsg(err.message || 'Error checking scanned tickets.');
        },
      }
    );
  };

  const handleReset = () => {
    setTicketInput('');
    setSingleResults(null);
    setHasSearchedSingle(false);
    setBatchResults(null);
    setBatchSummary(null);
    setErrorMsg(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E7E3] pb-4 space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Financial Lookup Tool
          </span>

          {/* Quick Trigger Button for Scanner */}
          <button
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer font-tabular"
          >
            <Camera className="w-4 h-4 text-[#C8A45D]" />
            <span>Scan Tickets (Multi-Scan)</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
          Check Your Tickets
        </h2>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Scan barcodes or enter 6-digit series/4-digit slips to verify against official Kerala LOTIS gazette results.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSingleSubmit} className="space-y-4">
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
              Ticket Number / Manual Entry
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                id="ticket-number-input"
                type="text"
                placeholder={t('ui.enter_ticket_number', 'e.g. 320327, PS 320327, 0266')}
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] text-sm sm:text-base text-[#17201D] font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-[#68736E]"
              />
              <button
                type="submit"
                disabled={singleLoading || ticketInput.trim().length < 3}
                className="px-6 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 font-tabular cursor-pointer"
              >
                {singleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('ui.searching', 'Verifying...')}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{t('ui.check_ticket_btn', 'Check Ticket')}</span>
                  </>
                )}
              </button>

              {/* Camera Scanner Button Beside Search */}
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="px-4 py-3 rounded-xl bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#0B3B32] border border-[#E2E7E3] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Scan multiple tickets via camera"
              >
                <Camera className="w-4 h-4 text-[#0B3B32]" />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-[#B54747]">{errorMsg}</p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#68736E]">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />
            <span>Checks directly against published official Kerala Government LOTIS results.</span>
          </p>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="font-bold text-[#0B3B32] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Need to check multiple tickets? Open Multi-Scanner</span>
          </button>
        </div>
      </form>

      {/* Loading State for Batch Checking */}
      {checkTicketsMutation.isPending && (
        <div className="pt-6 border-t border-[#E2E7E3] py-10 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#0B3B32] animate-spin" />
          <p className="text-xs font-bold text-[#17201D]">
            Checking scanned tickets against verified draw records...
          </p>
        </div>
      )}

      {/* BATCH RESULTS VIEW (From Scanner) */}
      {batchResults && batchSummary && (
        <div className="pt-6 border-t border-[#E2E7E3] space-y-6 animate-fadeIn">
          {/* Summary Banner */}
          <div className="bg-[#10201D] text-white p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-tabular">
            <div>
              <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-widest block">
                Batch Verification Completed
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                {batchSummary.total} Ticket{batchSummary.total === 1 ? '' : 's'} Checked
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                <span className="text-slate-300 block text-[10px] uppercase font-bold">Winning</span>
                <span className="text-lg font-black text-[#74E3B7]">{batchSummary.winning}</span>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                <span className="text-slate-300 block text-[10px] uppercase font-bold">No Prize</span>
                <span className="text-lg font-black text-slate-300">{batchSummary.nonWinning}</span>
              </div>
              <button
                onClick={() => setScannerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan More</span>
              </button>
            </div>
          </div>

          {/* Cards for each checked ticket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batchResults.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-5 border space-y-3 transition-all ${
                  item.isMatch
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                    : 'bg-[#F7F7F4] border-[#E2E7E3]'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-[#17201D] bg-white border border-[#E2E7E3] px-2.5 py-0.5 rounded-md font-tabular shadow-2xs">
                    {item.normalizedDisplay || item.inputTicket}
                  </span>

                  {item.isMatch ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#16845B] text-white font-tabular">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>WINNING TICKET</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 font-tabular">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>No prize</span>
                    </span>
                  )}
                </div>

                {/* Prize Breakdown (If Match) */}
                {item.isMatch ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between border-b border-emerald-200/60 pb-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                          {item.prizeCategory || 'Prize'}
                        </span>
                        <span className="text-xs text-slate-600">
                          {item.lotteryName} ({item.drawNumber})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-800 block font-bold uppercase">
                          Prize Amount
                        </span>
                        <span className="text-xl font-black text-[#16845B] font-tabular">
                          {item.prizeAmountFormatted || `₹${item.prizeAmount || 0}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <span>Draw: {item.drawDate || 'Official Result'}</span>
                      {item.resultUrl && (
                        <Link
                          href={item.resultUrl}
                          className="font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1"
                        >
                          <span>View Official Result</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#68736E] leading-relaxed pt-1">
                    This ticket number does not match any currently published winning number in official records.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F1F4F2] text-xs font-bold text-[#17201D] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#68736E]" />
              <span>Clear & Check More Tickets</span>
            </button>
          </div>
        </div>
      )}

      {/* SINGLE SEARCH RESULTS VIEW */}
      {hasSearchedSingle && (
        <div className="pt-6 border-t border-[#E2E7E3] animate-fadeIn space-y-4">
          {singleResults && singleResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#16845B]/10 border border-[#16845B]/30 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#16845B]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t('ui.prize_match', 'Winning ticket record found!')} ({ticketInput})</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#0B3B32] font-bold hover:underline cursor-pointer"
                >
                  Check Another Ticket
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {singleResults.map((r: any, idx: number) => {
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
                <span>{t('ui.no_match', 'No matching prize found for')} "{ticketInput}"</span>
              </div>
              <p className="text-xs text-[#68736E] max-w-md mx-auto leading-relaxed">
                This ticket number does not match any currently published winning numbers in the database. Please verify the ticket series and digits against the complete prize table.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E7E3] hover:bg-[#F1F4F2] text-xs font-bold text-[#17201D] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#68736E]" />
                  <span>Check Another Ticket</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Ticket Scanner Modal */}
      <TicketScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onTicketsScanned={handleTicketsScanned}
      />
    </div>
  );
}
