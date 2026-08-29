import React from 'react';
import Link from 'next/link';
import { Award, Calendar, Search, ArrowRight, Home, Ticket, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8">
      <div className="w-16 h-16 rounded-3xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center mx-auto border border-[#E2E7E3]">
        <HelpCircle className="w-8 h-8 text-[#0B3B32]" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider font-tabular block">
          Error 404 • Page Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          The requested page could not be found
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-lg mx-auto leading-relaxed">
          The lottery result or page you are searching for might have been updated, rescheduled, or moved. Explore our core resources below:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left pt-4">
        <Link
          href="/kerala-lottery-result-today"
          className="bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors group shadow-xs space-y-1"
        >
          <span className="text-xs font-bold text-[#0B3B32] block">Today's Results</span>
          <span className="text-[11px] text-[#68736E] block">View the latest certified draw winning numbers.</span>
        </Link>

        <Link
          href="/results"
          className="bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors group shadow-xs space-y-1"
        >
          <span className="text-xs font-bold text-[#0B3B32] block">Results Hub</span>
          <span className="text-[11px] text-[#68736E] block">Browse all published Kerala lottery draws.</span>
        </Link>

        <Link
          href="/lotteries"
          className="bg-white p-5 rounded-2xl border border-[#E2E7E3] hover:border-[#0B3B32] transition-colors group shadow-xs space-y-1"
        >
          <span className="text-xs font-bold text-[#0B3B32] block">Lottery Schemes</span>
          <span className="text-[11px] text-[#68736E] block">Weekly timetables, bumper jackpot structures.</span>
        </Link>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#0B3B32] hover:bg-[#10201D] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
