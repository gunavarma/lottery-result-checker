'use client';

import React, { useState } from 'react';
import { Search, Award, CheckCircle, XCircle, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { formatINR } from '@/lib/prisma';

export function TicketChecker() {
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketInput.trim();
    if (!query || query.length < 3) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.results.winningTickets || []);
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

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Check Your Kerala Lottery Ticket
          </h3>
          <p className="text-xs text-slate-500">
            Enter your 4-digit or 6-digit ticket number to check winning status instantly.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="e.g. 320327, PS 320327, 0266"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-base font-semibold placeholder:font-sans placeholder:font-normal"
          />
        </div>
        <button
          type="submit"
          disabled={loading || ticketInput.trim().length < 3}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Check Number</span>
            </>
          )}
        </button>
      </form>

      {/* Results View */}
      {hasSearched && (
        <div className="mt-5 pt-5 border-t border-slate-100 animate-fadeIn">
          {results && results.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Found {results.length} winning match(es) for "{ticketInput}"!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((r: any, idx: number) => {
                  const prize = r.prize;
                  const draw = prize?.draw;
                  const lottery = draw?.lottery;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-emerald-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 uppercase">
                          {lottery?.name || 'Kerala Lottery'}
                        </span>
                        <span className="text-xs font-mono font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                          {draw?.drawNumber}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs text-slate-500 block">{prize?.category}</span>
                          <span className="text-xl font-extrabold text-slate-900 font-mono">
                            {r.displayNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Prize Amount</span>
                          <span className="text-lg font-black text-emerald-600">
                            {formatINR(prize?.amount)}
                          </span>
                        </div>
                      </div>

                      {r.location && (
                        <p className="text-[11px] text-slate-500">
                          Location: <strong className="text-slate-700">{r.location}</strong>
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Date: {draw?.drawDate?.split('T')[0]}
                        </span>
                        <a
                          href={`/result/${draw?.drawDate?.split('T')[0]}/${lottery?.slug}`}
                          className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Full Result</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>No matching winning prize record found for "{ticketInput}" in recent verified results.</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Please double check your ticket numbers or check the complete prize table below.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
