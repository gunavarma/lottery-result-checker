import React, { useState, useEffect, useMemo } from 'react';
import Link from "@/components/Link";
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PrizeTable } from '@/components/PrizeTable';
import { OfficialSourceBadge } from '@/components/OfficialSourceBadge';
import { ResultShareBar } from '@/components/ResultShareBar';
import { formatINR } from '@/lib/format';
import {
  Calendar as CalendarIcon,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DrawResult {
  id: string;
  drawNumber: string;
  drawDate: string;
  drawTime: string;
  status: string;
  sourceUrl: string;
  sourceDocumentUrl?: string | null;
  verificationLevel?: 'OFFICIAL' | 'PROVISIONAL' | null;
  sourceProvider?: string | null;
  provisionalUpdatedAt?: string | null;
  lottery: {
    id: string;
    name: string;
    slug: string;
    code: string;
    drawDay: string;
  };
  prizes: Array<{
    id: string;
    category: string;
    description?: string | null;
    amount: number | string;
    orderIndex: number;
    winningNumbers: Array<{
      id: string;
      series?: string | null;
      number: string;
      displayNumber: string;
      location?: string | null;
    }>;
  }>;
}

interface PreviousResultsPageProps {
  initialAvailableDates?: string[];
  initialDate?: string;
  initialDraws?: DrawResult[];
  locale?: string;
}

export default function PreviousResultsPage({
  initialAvailableDates = [],
  initialDate = '',
  initialDraws = [],
  locale = 'en',
}: PreviousResultsPageProps) {
  const [availableDates, setAvailableDates] = useState<string[]>(initialAvailableDates);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedLottery, setSelectedLottery] = useState<string>('all');
  const [loadingDates, setLoadingDates] = useState<boolean>(initialAvailableDates.length === 0);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const [draws, setDraws] = useState<DrawResult[]>(initialDraws);
  const [searchedDate, setSearchedDate] = useState<string>(initialDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch dates only if server didn't provide them (offline/degraded)
  useEffect(() => {
    if (availableDates.length > 0) return;

    async function loadDates() {
      try {
        setLoadingDates(true);
        const res = await fetch('/api/results/dates');
        const json = await res.json();
        if (json.success && Array.isArray(json.dates) && json.dates.length > 0) {
          setAvailableDates(json.dates);
          if (!selectedDate || !json.dates.includes(selectedDate)) {
            const newInitial = json.dates[0];
            setSelectedDate(newInitial);
            setSearchedDate(newInitial);
            fetchResultsForDate(newInitial);
          }
        }
      } catch (err: any) {
        console.error('Failed to load available dates:', err);
      } finally {
        setLoadingDates(false);
      }
    }
    loadDates();
  }, []);

  // Fetch results for a specific date
  async function fetchResultsForDate(dateStr: string) {
    if (!dateStr) return;
    try {
      setLoadingResults(true);
      setErrorMessage(null);
      setSearchedDate(dateStr);

      const res = await fetch(`/api/results/date/${dateStr}`);
      const json = await res.json();

      if (!res.ok && !json.success) {
        throw new Error(json.error || `HTTP ${res.status}: Failed to load results`);
      }

      if (json.success && Array.isArray(json.draws)) {
        setDraws(json.draws);
      } else {
        setDraws([]);
      }
    } catch (err: any) {
      console.error('Error fetching date results:', err);
      setErrorMessage(err.message || 'Unable to connect to the result service. Please try again.');
      setDraws([]);
    } finally {
      setLoadingResults(false);
    }
  }

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchResultsForDate(newDate);
  };

  const handleQuickJump = (dateStr: string) => {
    setSelectedDate(dateStr);
    fetchResultsForDate(dateStr);
  };

  const filteredDraws = selectedLottery === 'all'
    ? draws
    : draws.filter((d) => d.lottery.slug === selectedLottery || d.lottery.code === selectedLottery);

  const availableLotteries = useMemo(() =>
    Array.from(
      new Map(draws.map((d) => [d.lottery.slug, d.lottery])).values()
    ),
    [draws]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Kerala Lottery Results', href: '/results' },
          { label: 'Previous Results' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Authoritative Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Previous Results & Historical Archive
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl">
          Inspect certified Kerala State Lottery draw results from official LOTIS gazettes. Select any previous date to view certified winning ticket numbers and prize categories.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
          <div className="flex items-center gap-2 text-[#17201D]">
            <CalendarIcon className="w-5 h-5 text-[#0B3B32]" />
            <h2 className="text-base sm:text-lg font-extrabold">
              Select Draw Date
            </h2>
          </div>

          {availableDates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-[#68736E] mr-1 font-tabular">
                Recent:
              </span>
              {availableDates.slice(0, 4).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleQuickJump(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-tabular transition-colors cursor-pointer ${
                    selectedDate === d
                      ? 'bg-[#0B3B32] text-white'
                      : 'bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#17201D]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="select-available-date" className="text-xs font-bold text-[#17201D] block">
              Available Verified Dates
            </label>
            <div className="relative">
              <select
                id="select-available-date"
                value={selectedDate}
                onChange={handleDateSelect}
                disabled={loadingDates}
                className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] font-tabular focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer"
              >
                {loadingDates ? (
                  <option>Loading dates...</option>
                ) : availableDates.length === 0 ? (
                  <option>No verified dates available</option>
                ) : (
                  availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="custom-date-picker" className="text-xs font-bold text-[#17201D] block">
              Calendar Date Picker
            </label>
            <input
              id="custom-date-picker"
              type="date"
              value={selectedDate}
              onChange={handleDateSelect}
              className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] font-tabular focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lottery-scheme-filter" className="text-xs font-bold text-[#17201D] block">
              Filter Scheme (On this date)
            </label>
            <select
              id="lottery-scheme-filter"
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              disabled={availableLotteries.length <= 1}
              className="w-full bg-[#F7F7F4] border border-[#E2E7E3] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#17201D] focus:bg-white focus:outline-hidden focus:border-[#0B3B32] cursor-pointer"
            >
              <option value="all">All Lotteries on this Date</option>
              {availableLotteries.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loadingResults ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#E2E7E3] shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#0B3B32] flex items-center justify-center mx-auto animate-spin">
              <Loader2 className="w-6 h-6 text-[#0B3B32]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#17201D]">
                Loading Official Kerala Lottery Results...
              </h3>
              <p className="text-xs text-[#68736E]">
                Querying verified database records for {selectedDate}.
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#17201D]">
                Unable to Load Result
              </h3>
              <p className="text-xs text-[#68736E] max-w-md mx-auto">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchResultsForDate(selectedDate)}
              className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Query</span>
            </button>
          </div>
        ) : filteredDraws.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E7E3] shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F4] text-[#68736E] flex items-center justify-center mx-auto">
              <CalendarIcon className="w-6 h-6 text-[#C8A45D]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#17201D]">
                No verified result is available for this date.
              </h3>
              <p className="text-xs text-[#68736E] max-w-md mx-auto">
                No official Kerala State Lottery draw occurred or has been published for {searchedDate || selectedDate}. Kerala lotteries run according to the official weekly draw timetable.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/results"
                className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
              >
                <span>Browse All Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/lottery-calendar"
                className="inline-flex items-center gap-2 bg-[#F1F4F2] hover:bg-[#E2E7E3] text-[#0B3B32] px-4 py-2 rounded-xl font-bold text-xs transition-colors"
              >
                <span>View Timetable</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredDraws.map((draw) => {
              const firstPrize = draw.prizes?.find(
                (p) => p.orderIndex === 0 || p.category.toLowerCase().includes('1st')
              );
              const firstWinner = firstPrize?.winningNumbers?.[0];

              return (
                <div
                  key={draw.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#F1F4F2] text-[#0B3B32] px-2.5 py-0.5 rounded-md border border-[#E2E7E3]">
                          {draw.lottery.code}
                        </span>
                        <span className="font-bold text-xs bg-[#0B3B32] text-white px-3 py-0.5 rounded-md">
                          OFFICIAL VERIFIED
                        </span>
                        {draw.sourceDocumentUrl && (
                          <OfficialSourceBadge
                            sourceUrl={draw.sourceDocumentUrl}
                            drawNumber={draw.drawNumber}
                            drawDate={draw.drawDate}
                          />
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D]">
                        {draw.lottery.name} ({draw.drawNumber})
                      </h2>
                      <p className="text-xs text-[#68736E]">
                        Held on {draw.drawDate} at {draw.drawTime} |
                        {(draw.verificationLevel ?? 'OFFICIAL') === 'PROVISIONAL'
                          ? 'Live source — awaiting gazette'
                          : 'Official Gazette Certified'}
                      </p>
                    </div>

                    {firstWinner && (
                      <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#E2E7E3] text-center shrink-0 min-w-[200px]">
                        <span className="text-[10px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                          1st Prize ({firstPrize ? formatINR(firstPrize.amount) : '₹1 Crore'})
                        </span>
                        <span className="text-2xl font-black font-mono text-[#16845B] block mt-1">
                          {firstWinner.displayNumber}
                        </span>
                        {firstWinner.location && (
                          <span className="text-[11px] text-[#68736E] font-medium block mt-0.5">
                            Sold at: {firstWinner.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <PrizeTable
                      lotteryName={draw.lottery.name}
                      drawNumber={draw.drawNumber}
                      prizes={draw.prizes as any}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E7E3]">
                    <Link
                      href={`/results/date/${draw.drawDate}`}
                      className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#16845B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Permanent Date URL</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <ResultShareBar
                      title={`${draw.lottery.name} (${draw.drawNumber}) on ${draw.drawDate}`}
                      url={`/results/date/${draw.drawDate}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#F7F7F4] rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16845B] shrink-0" />
          <span>
            Every historical result is verified directly against certified Kerala Government LOTIS Directorate gazette publications.
          </span>
        </div>
        <Link
          href="/check-ticket"
          className="font-bold text-[#0B3B32] hover:underline shrink-0"
        >
          Check physical ticket numbers →
        </Link>
      </div>
    </div>
  );
}
