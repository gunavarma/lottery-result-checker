'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Award,
  Calendar,
  Ticket,
  Newspaper,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatINR } from '@/lib/prisma';
import { getAllNews } from '@/lib/news';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    lotteries: any[];
    draws: any[];
    winningTickets: any[];
    news: any[];
  }>({
    lotteries: [],
    draws: [],
    winningTickets: [],
    news: []
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({ lotteries: [], draws: [], winningTickets: [], news: [] });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (q: string) => {
    setQuery(q);
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults({ lotteries: [], draws: [], winningTickets: [], news: [] });
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch API search results
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();

      // 2. Filter news articles locally
      const allNews = getAllNews();
      const matchedNews = allNews.filter(
        a =>
          a.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(trimmed.toLowerCase()) ||
          a.category.toLowerCase().includes(trimmed.toLowerCase())
      );

      if (json.success) {
        setResults({
          lotteries: json.results.lotteries || [],
          draws: json.results.draws || [],
          winningTickets: json.results.winningTickets || [],
          news: matchedNews
        });
      } else {
        setResults({
          lotteries: [],
          draws: [],
          winningTickets: [],
          news: matchedNews
        });
      }
    } catch {
      // Fallback on search network error
    } finally {
      setLoading(false);
    }
  };

  const handleFullSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalResults =
    results.lotteries.length +
    results.draws.length +
    results.winningTickets.length +
    results.news.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4" role="dialog" aria-modal="true" aria-label="Search Kerala Lottery Database">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#10201D]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E7E3] overflow-hidden animate-fadeIn z-10 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleFullSubmit} className="relative flex items-center border-b border-[#E2E7E3] px-4 py-3 sm:px-6 sm:py-4">
          <Search className="w-5 h-5 text-[#68736E] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search lottery schemes, draw numbers, ticket numbers or news"
            placeholder="Search lottery scheme, draw number (e.g. KN-638), 6-digit ticket, or news..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-3 pr-10 text-sm sm:text-base text-[#17201D] bg-transparent focus:outline-none placeholder:text-[#68736E]"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#0B3B32] animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              aria-label="Clear search query"
              onClick={() => handleSearch('')}
              className="p-1 rounded-full text-[#68736E] hover:text-[#17201D] hover:bg-[#F1F4F2]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-[#68736E] bg-[#F1F4F2] px-2 py-0.5 rounded border border-[#E2E7E3]">
              ESC
            </kbd>
          )}
        </form>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {query.trim().length < 2 ? (
            /* Popular Searches / Suggestions */
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-[#68736E] uppercase tracking-wider block">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Suvarna Keralam', 'Karunya Plus', 'Fifty-Fifty', 'Thiruvonam Bumper', 'How to claim prize'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSearch(term)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F7F7F4] hover:bg-[#0B3B32] hover:text-white text-xs font-semibold text-[#17201D] border border-[#E2E7E3] transition-colors flex items-center gap-1.5"
                  >
                    <Search className="w-3 h-3 text-[#68736E]" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults > 0 ? (
            <div className="space-y-6">
              {/* Schemes */}
              {results.lotteries.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                    Lottery Schemes ({results.lotteries.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.lotteries.map((lottery) => (
                      <Link
                        key={lottery.id}
                        href={`/lottery/${lottery.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group"
                      >
                        <div>
                          <span className="font-extrabold text-sm text-[#17201D] group-hover:text-[#0B3B32]">
                            {lottery.name}
                          </span>
                          <span className="text-xs text-[#68736E] block">
                            Draw Day: {lottery.drawDay} • Ticket: ₹{lottery.ticketPrice}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Winning Tickets Matched */}
              {results.winningTickets.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#16845B] uppercase tracking-wider block font-tabular">
                    Winning Number Matches ({results.winningTickets.length})
                  </span>
                  <div className="space-y-2">
                    {results.winningTickets.map((ticket, idx) => {
                      const draw = ticket.prize?.draw;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#F7F7F4] border border-[#E2E7E3] flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-[#0B3B32] uppercase">
                              {draw?.lottery?.name || 'Kerala Lottery'} ({draw?.drawNumber})
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="font-mono font-black text-base text-[#17201D]">
                                {ticket.displayNumber}
                              </span>
                              <span className="text-xs font-semibold text-[#16845B]">
                                {ticket.prize?.category} • {formatINR(ticket.prize?.amount)}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/result/${draw?.drawDate?.split('T')[0]}/${draw?.lottery?.slug}`}
                            onClick={onClose}
                            className="text-xs font-bold text-[#0B3B32] hover:underline"
                          >
                            View Result
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Draws */}
              {results.draws.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                    Draw Results ({results.draws.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.draws.map((draw) => (
                      <Link
                        key={draw.id}
                        href={`/result/${draw.drawDate?.split('T')[0]}/${draw.lottery?.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group"
                      >
                        <div>
                          <span className="font-bold text-sm text-[#17201D] group-hover:text-[#0B3B32]">
                            {draw.lottery?.name} ({draw.drawNumber})
                          </span>
                          <span className="text-xs text-[#68736E] block font-mono">
                            Date: {draw.drawDate?.split('T')[0]}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* News */}
              {results.news.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
                    Articles & Guides ({results.news.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.news.map((n) => (
                      <Link
                        key={n.id}
                        href={`/news/${n.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors group"
                      >
                        <div>
                          <span className="font-bold text-sm text-[#17201D] group-hover:text-[#0B3B32] block">
                            {n.title}
                          </span>
                          <span className="text-xs text-[#68736E]">
                            {n.category} • {n.readTime}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#68736E] group-hover:text-[#0B3B32] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-bold text-[#17201D]">
                No matching records found for "{query}"
              </p>
              <p className="text-xs text-[#68736E] max-w-sm mx-auto">
                Try searching with a lottery scheme name (e.g. Suvarna Keralam), a draw number (e.g. SK-67), or a 6-digit ticket number.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E2E7E3] p-3 sm:px-6 bg-[#F7F7F4] flex items-center justify-between text-xs text-[#68736E]">
          <span>Press <strong>Enter</strong> to open detailed search results</span>
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onClose}
            className="text-[#0B3B32] font-bold hover:underline"
          >
            Full Search Page
          </Link>
        </div>
      </div>
    </div>
  );
}
