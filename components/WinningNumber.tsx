'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface WinningNumberProps {
  number?: string | null;
  series?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  status?: 'PUBLISHED' | 'CHECKING' | 'WAITING' | 'FAILED';
  showCopy?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export function WinningNumber({
  number,
  series,
  size = 'md',
  status = 'PUBLISHED',
  showCopy = true,
  className = '',
  theme = 'dark',
}: WinningNumberProps) {
  const [copied, setCopied] = useState(false);

  // Parse series and digits if number contains both (e.g. "KW 123456" or "PS320327")
  let displaySeries = series;
  let displayDigits = number || '';

  if (!displaySeries && number) {
    const parts = number.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].length <= 3) {
      displaySeries = parts[0];
      displayDigits = parts[1];
    } else {
      const match = number.match(/^([A-Z]{1,3})([0-9]+)$/i);
      if (match) {
        displaySeries = match[1];
        displayDigits = match[2];
      }
    }
  }

  const fullDisplay = displaySeries ? `${displaySeries} ${displayDigits}` : displayDigits;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullDisplay || status !== 'PUBLISHED') return;
    navigator.clipboard.writeText(fullDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sizing styles
  const sizeMap = {
    sm: {
      series: 'text-xs tracking-wider mr-1.5',
      digits: 'text-sm sm:text-base font-bold',
      container: 'py-1 px-2 text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      series: 'text-xs sm:text-sm tracking-wider mr-2 font-medium',
      digits: 'text-lg sm:text-xl font-extrabold',
      container: 'py-1.5 px-3',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      series: 'text-sm sm:text-base tracking-widest mr-2.5 font-medium',
      digits: 'text-2xl sm:text-3xl font-black',
      container: 'py-2 px-4',
      icon: 'w-4 h-4',
    },
    hero: {
      series: 'text-base sm:text-2xl lg:text-3xl tracking-widest mr-3 sm:mr-4 font-semibold text-[#C59B27]',
      digits: 'text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-wider',
      container: 'py-2 sm:py-3',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
    },
  };

  const currentSize = sizeMap[size];

  if (status === 'WAITING' || !fullDisplay) {
    return (
      <div className={`inline-flex items-center font-ticket-mono text-[#646E68] ${currentSize.digits} ${className}`}>
        <span>— — — — — —</span>
      </div>
    );
  }

  if (status === 'CHECKING') {
    return (
      <div className={`inline-flex items-center gap-2 font-ticket-mono text-[#C59B27] ${currentSize.digits} ${className}`}>
        <span className="animate-pulse">CHECKING RESULT...</span>
      </div>
    );
  }

  return (
    <div
      onClick={showCopy ? handleCopy : undefined}
      title={showCopy ? (copied ? 'Copied to clipboard' : 'Click to copy winning number') : undefined}
      className={`inline-flex items-baseline font-ticket-mono font-tabular select-all ${
        showCopy ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {displaySeries && (
        <span className={`uppercase font-ticket-mono ${currentSize.series}`}>
          {displaySeries}
        </span>
      )}
      <span className={`font-ticket-mono ${currentSize.digits}`}>
        {displayDigits}
      </span>

      {showCopy && (
        <button
          type="button"
          aria-label="Copy winning number"
          className={`ml-2.5 p-1 rounded transition-colors opacity-70 group-hover:opacity-100 ${
            theme === 'dark' ? 'text-[#C59B27] hover:bg-white/10' : 'text-[#646E68] hover:text-[#0A3828]'
          }`}
        >
          {copied ? (
            <Check className={`${currentSize.icon} text-[#127A52]`} />
          ) : (
            <Copy className={currentSize.icon} />
          )}
        </button>
      )}
    </div>
  );
}
