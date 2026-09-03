'use client';

import React from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface SyncIndicatorProps {
  isFetching: boolean;
  lastUpdated?: Date | string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Sleek, non-blocking background sync indicator
 * Never shifts layout or blocks user interaction.
 */
export function SyncIndicator({
  isFetching,
  lastUpdated,
  className = '',
  compact = false,
}: SyncIndicatorProps) {
  if (isFetching) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B3B32]/10 border border-[#0B3B32]/20 text-[#0B3B32] text-[11px] font-medium font-tabular animate-pulse ${className}`}
        title="Checking for latest verified updates in background"
      >
        <RefreshCw className="w-3 h-3 animate-spin text-[#16845B]" />
        {!compact && <span>Syncing...</span>}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-medium font-tabular ${className}`}
      title="Verified official database record"
    >
      <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
      {!compact && <span>Up to date</span>}
    </div>
  );
}
