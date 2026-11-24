import React, { useRef, useState, useEffect } from 'react';
import Link from '@/components/Link';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Camera,
  Ticket,
  XCircle,
  Calendar,
} from 'lucide-react';
import { lazy } from '@/components/lazy';
import { formatINR } from '@/lib/format';
import { useLanguage } from '@/context/LanguageContext';
import type { ScannedTicket } from '@/components/lottery/TicketScanner';
import { useCheckTickets, TicketMatchResult } from '@/hooks/queries/useCheckTickets';
import { trackTicketCheck, trackTicketCheckerOpen } from '@/lib/analytics';

// Lazy-load the camera/QR scanner to keep html5-qrcode and tesseract.js
// out of the initial JS bundle. Only loaded when the user opens the scanner.
const TicketScanner = lazy(() =>
  import('@/components/lottery/TicketScanner').then((mod) => mod.TicketScanner)
);

function formatDateOption(dateStr: string, index: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const formatted = dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    return index === 0 ? `${formatted} (Latest Draw)` : formatted;
  } catch {
    return dateStr;
  }
}

interface TicketCheckerProps {
  initialLotteryId?: string;
  initialDrawNumber?: string;
  /**
   * Ticket number to prefill, taken from the `?number=` query parameter.
   */
  initialNumber?: string;
  /**
   * Draw date to prefill (YYYY-MM-DD).
   */
  initialDate?: string;
  /**
   * Available verified draw dates passed from the server.
   */
  availableDates?: string[];
  /**
   * Legacy schemes list, maintained for backwards compatibility.
   */
  lotteries?: Array<{ id: string; name: string; code: string }>;
  /** Use tighter spacing for the homepage's single-card tool layout. */
  compact?: boolean;
}

export function TicketChecker({
  initialLotteryId,
  initialDrawNumber,
  initialNumber,
  initialDate,
  availableDates: serverDates,
  lotteries: serverLotteries,
  compact = false,
}: TicketCheckerProps) {
  const { t } = useLanguage();
  const [availableDates, setAvailableDates] = useState<string[]>(() => serverDates ?? []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState(initialDate || '');
  const [ticketInput, setTicketInput] = useState(initialNumber ?? '');
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
    notFound: number;
  } | null>(null);

  const checkTicketsMutation = useCheckTickets();

  // Engagement tracking: ref makes it fire once per visitor interaction
  const checkerOpenedRef = useRef(false);
  const markCheckerOpened = () => {
    if (checkerOpenedRef.current) return;
    checkerOpenedRef.current = true;
    trackTicketCheckerOpen();
  };

  // Load available dates if not prefilled by server
  useEffect(() => {
    if (availableDates.length > 0) return;

    async function fetchDates() {
      try {
        const res = await fetch('/api/results/dates');
        const json = await res.json();
        if (json.success && Array.isArray(json.dates) && json.dates.length > 0) {
          setAvailableDates(json.dates);
        }
      } catch {
        // Fallback gracefully on network error
      }
    }
    fetchDates();
  }, [availableDates.length]);

  // Single Ticket Manual Search
  const executeSingleSearch = async (query: string, date: string = selectedDate) => {
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
        const activeDate = date && date !== 'custom' ? date : '';
        if (activeDate) {
          winningMatches = winningMatches.filter((t: any) => {
            const dDate = t.prize?.draw?.drawDate;
            if (!dDate) return false;
            return dDate.startsWith(activeDate);
          });
        }
        setSingleResults(winningMatches);

        trackTicketCheck({
          lotteryName: activeDate ? `date:${activeDate}` : 'all',
          isWinner: winningMatches.length > 0,
        });
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
    const activeDate = selectedDate && selectedDate !== 'custom' ? selectedDate : undefined;

    // Trigger TanStack Query batch check mutation
    checkTicketsMutation.mutate(
      {
        tickets: ticketNumbers,
        date: activeDate,
      },
      {
        onSuccess: (data) => {
          if (data.results) {
            const winning = data.results.filter((r) => r.isMatch).length;
            const notFound = data.results.filter((r) => r.status === 'NOT_FOUND').length;
            const nonWinning = data.results.length - winning - notFound;

            setBatchResults(data.results);
            setBatchSummary({
              total: data.results.length,
              winning,
              nonWinning,
              notFound,
            });
            setHasSearchedSingle(false);
            setSingleResults(null);

            trackTicketCheck({
              lotteryName: activeDate ? `date:${activeDate}` : 'all',
              isWinner: winning > 0,
            });
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
    <div
      className={`bg-white rounded-3xl ${
        compact
          ? 'p-4 sm:p-5 border border-[#E2E7E3] shadow-xs space-y-4'
          : 'p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6'
      }`}
    >
      <div onFocusCapture={markCheckerOpened} className={compact ? 'space-y-4' : 'space-y-6'}>
        {/* Card Header / Toolbar */}
        {compact ? (
          <div className="border-b border-[#E2E7E3] pb-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#17201D] tracking-tight">
                {t('ticket.heading', 'Check Your Tickets')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  markCheckerOpened();
                  setScannerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#C8A45D]" />
                <span>{t('ticket.scan', 'Scan')}</span>
              </button>
            </div>
            <p className="text-xs text-[#68736E]">
              {t(
                'ticket.subheading',
                'Enter your ticket number or scan with camera to verify against official results.'
              )}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E7E3]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E9F3EE] text-[#0B3B32] flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#17201D]">
                  Verify Ticket Numbers
                </h2>
                <p className="text-xs text-[#68736E]">
                  Select draw date and enter your ticket digits to check
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                markCheckerOpened();
                setScannerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#C8A45D]" />
              <span className="hidden sm:inline">{t('ticket.scan_btn', 'Scan with Camera')}</span>
              <span className="sm:hidden">{t('ticket.scan', 'Scan')}</span>
            </button>
          </div>
        )}

        {/* Lookup Form */}
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
            {/* Draw Date Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="lottery-date-select"
                  className="block text-xs font-bold text-[#17201D] uppercase tracking-wider font-tabular"
                >
                  {t('ticket.date_label', 'Draw Date')}
                </label>
                {isCustomDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDate(false);
                      setSelectedDate('');
                    }}
                    className="text-[11px] font-semibold text-[#0B3B32] hover:underline cursor-pointer"
                  >
                    Recent list
                  </button>
                )}
              </div>

              {isCustomDate ? (
                <div className="relative">
                  <input
                    id="lottery-date-select"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setSelectedDate(e.target.value);
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] transition-colors"
                  />
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="lottery-date-select"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomDate(true);
                      } else {
                        setSelectedDate(e.target.value);
                      }
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] text-xs font-bold text-[#17201D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] transition-colors cursor-pointer"
                  >
                    <option value="">{t('ticket.all_dates', 'All Recent Draws (Default)')}</option>
                    {availableDates.slice(0, 30).map((d, idx) => (
                      <option key={d} value={d}>
                        {formatDateOption(d, idx)}
                      </option>
                    ))}
                    <option value="custom">📅 {t('ticket.custom_date', 'Pick specific date…')}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Ticket Number Input */}
            <div className="md:col-span-8 space-y-1.5">
              <label
                htmlFor="ticket-number-input"
                className="block text-xs font-bold text-[#17201D] uppercase tracking-wider font-tabular"
              >
                {t('ticket.number_label', 'Ticket Number')}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="ticket-number-input"
                    type="text"
                    placeholder={t('ui.enter_ticket_number', 'e.g. 320327, SK 320327, 0266')}
                    value={ticketInput}
                    onChange={(e) => {
                      setTicketInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E7E3] bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B32] text-sm sm:text-base text-[#17201D] font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-[#68736E] transition-colors"
                  />
                  {ticketInput && (
                    <button
                      type="button"
                      onClick={() => setTicketInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Clear input"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={singleLoading || ticketInput.trim().length < 3}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 font-tabular cursor-pointer min-h-[46px]"
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

                  <button
                    type="button"
                    onClick={() => {
                      markCheckerOpened();
                      setScannerOpen(true);
                    }}
                    className="px-4 py-3 rounded-xl bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] border border-[#D8E0DB] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[46px]"
                    title="Scan ticket with camera or upload photo"
                  >
                    <Camera className="w-4 h-4 text-[#0B3B32]" />
                    <span>{t('ticket.scan', 'Scan')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#B54747]">{errorMsg}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-[#52605A] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#16845B] shrink-0" />
            <span>{t('ticket.note', 'Checks directly against published official Kerala Government LOTIS results.')}</span>
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
                {batchSummary.notFound > 0 && (
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-amber-400/40">
                    <span className="text-amber-200 block text-[10px] uppercase font-bold">Not Found</span>
                    <span className="text-lg font-black text-amber-300">
                      {batchSummary.notFound}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    markCheckerOpened();
                    setScannerOpen(true);
                  }}
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
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : item.status === 'NOT_FOUND'
                        ? 'bg-amber-50/60 border-amber-300'
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
                    ) : item.status === 'NOT_FOUND' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 font-tabular">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Not found</span>
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
                  ) : item.status === 'NOT_FOUND' ? (
                    <p className="text-xs text-amber-800 leading-relaxed pt-1">
                      {item.message ||
                        'No published result was available to check this ticket against yet. It has not been marked as a loss.'}
                    </p>
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
                  This ticket number does not match any currently published winning numbers in official records for this check. Please verify your ticket series and digits against the complete prize table.
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
        {scannerOpen && (
          <TicketScanner
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            onTicketsScanned={handleTicketsScanned}
          />
        )}
      </div>
    </div>
  );
}
