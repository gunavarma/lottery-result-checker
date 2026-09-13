import React from 'react';
import { Radio, ShieldAlert, RefreshCw } from 'lucide-react';

interface ProvisionalResultBannerProps {
  /** Live aggregator page the numbers were read from. */
  sourceUrl?: string | null;
  /** Human label of the source provider. */
  providerLabel?: string;
  /** When the provisional payload was last refreshed. */
  updatedAt?: string | Date | null;
  /** How many prize tiers are present so far. */
  tierCount?: number | null;
  /** Whether the full expected prize structure has arrived. */
  isComplete?: boolean | null;
  compact?: boolean;
  className?: string;
}

function relativeTime(value?: string | Date | null): string | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

/**
 * Trust label for results that came from the unofficial live aggregator and
 * have NOT yet been confirmed by the official LOTIS gazette.
 *
 * This must be shown anywhere provisional numbers are rendered, and the words
 * "official" / "certified" must never be used alongside it.
 */
export function ProvisionalResultBanner({
  sourceUrl,
  providerLabel = 'keralalotteries.net',
  updatedAt,
  tierCount,
  isComplete,
  compact = false,
  className = '',
}: ProvisionalResultBannerProps) {
  const age = relativeTime(updatedAt);

  return (
    <div
      role="status"
      className={`rounded-2xl border border-[#C8A45D]/40 bg-[#C8A45D]/10 p-4 space-y-2 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8A6A24] text-white text-[10px] font-black uppercase tracking-wider font-tabular">
          <Radio className="w-3 h-3" />
          Live · Unofficial
        </span>

        {typeof tierCount === 'number' && (
          <span className="text-[11px] font-bold text-[#8A6A24] font-tabular">
            {isComplete
              ? 'All prize tiers published'
              : `${tierCount} prize tier${tierCount === 1 ? '' : 's'} so far — still updating`}
          </span>
        )}

        {age && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#68736E] font-tabular">
            <RefreshCw className="w-3 h-3" />
            Updated {age}
          </span>
        )}
      </div>

      {!compact && (
        <p className="text-[11px] sm:text-xs text-[#5B4A1F] leading-relaxed flex items-start gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8A6A24]" />
          <span>
            These winning numbers are published from the third-party live source{' '}
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-bold underline decoration-dotted"
              >
                {providerLabel}
              </a>
            ) : (
              <strong>{providerLabel}</strong>
            )}{' '}
            as soon as they are announced, <strong>before</strong> the Government gazette is released.
            They are not yet officially verified and may change. Confirm with the official Kerala State
            Lotteries gazette before claiming any prize.
          </span>
        </p>
      )}
    </div>
  );
}
