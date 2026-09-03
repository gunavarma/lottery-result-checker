'use client';

import React from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#F7F7F4] text-[#17201D] font-sans p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E2E7E3] shadow-lg text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block">
              KeralaDraws
            </span>
            <h1 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
              Something went wrong
            </h1>
            <p className="text-xs text-[#68736E] leading-relaxed">
              An unexpected system error occurred. Please try reloading the page.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#F7F7F4] hover:bg-[#E2E7E3] text-[#17201D] font-bold text-xs border border-[#E2E7E3] transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
