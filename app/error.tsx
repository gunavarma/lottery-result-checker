'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, Award } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E2E7E3] shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#0B3B32]/10 border border-[#0B3B32]/20 flex items-center justify-center mx-auto text-[#0B3B32]">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
            KeralaDraws Platform
          </span>
          <h1 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
            Temporary Server Issue
          </h1>
          <p className="text-xs text-[#68736E] leading-relaxed">
            We are experiencing a temporary issue retrieving live lottery records. Please reload the page or navigate back to the home terminal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F7F7F4] hover:bg-[#F1F4F2] text-[#17201D] font-bold text-xs border border-[#E2E7E3] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
