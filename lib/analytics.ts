/**
 * Google Analytics 4 — the single entry point for KeralaDraws analytics.
 *
 * ## Why this module exists
 *
 * `astro/layouts/BaseLayout.astro` owns *loading* GA: it is the only place the
 * `gtag.js` tag and the `gtag('config', …)` call live, so no page can load the
 * library twice or emit a second `page_view`. This module owns *reporting*: the
 * six bespoke events in `ANALYTICS_EVENTS` all funnel through `trackEvent()`,
 * so the payload shape is defined once and cannot drift into whatever a call
 * site happens to pass.
 *
 * ## Why events are safe to fire before gtag.js has loaded
 *
 * GA is deliberately deferred (see the layout) to keep the tag off the critical
 * path. The layout therefore defines the standard `dataLayer` + `window.gtag`
 * shim *synchronously in the `<head>`, and only the network request for
 * `gtag.js` is deferred. Google's own replay semantics then guarantee ordering:
 * anything pushed before the library arrives is processed in order when it
 * does. A `trackEvent()` call from an island that hydrates early is therefore
 * never lost and never duplicated.
 *
 * ## SSR safety
 *
 * There is no `window` on the server and Astro runs this module during the
 * request render as well as in the browser, so every function below starts with
 * a guard and degrades to a silent no-op. `resultViewEvent()` is the one
 * server-side helper: it *builds* an event that the layout serialises, rather
 * than sending one.
 *
 * ## Privacy
 *
 * Nothing here accepts, forwards or can leak a ticket number, phone number,
 * email address, name, auth token or API key. `ticket_check` reports only the
 * boolean outcome (`winner` / `not_winner`) — never the ticket, never the
 * matched prize amount. `sanitizeAnalyticsParams()` is the second line of
 * defence: it drops every non-primitive value (objects/arrays/functions), so a
 * future caller cannot accidentally ship a whole user record into GA.
 */

/** Values GA4 accepts as a custom event parameter. */
export type AnalyticsParamValue = string | number | boolean;

/** Raw parameter map accepted from call sites (nullable values are dropped). */
export type AnalyticsParams = Record<
  string,
  AnalyticsParamValue | null | undefined
>;

/** A server-built event, handed to the layout and serialised into the page. */
export interface AnalyticsEvent {
  name: string;
  params?: AnalyticsParams;
}

/**
 * Every bespoke event KeralaDraws sends.
 *
 * Google's Enhanced Measurement already covers `page_view`, scrolls, outbound
 * clicks, site search, video engagement and file downloads, so none of those
 * are re-created here. These six are the only interactions the GA4 web stream
 * cannot infer on its own.
 */
export const ANALYTICS_EVENTS = {
  /** A published result page was viewed. */
  RESULT_VIEW: 'result_view',
  /** The homepage finder was used to look up a past draw. */
  HISTORICAL_RESULT_SEARCH: 'historical_result_search',
  /** The ticket checker was engaged (input focused or scanner opened). */
  TICKET_CHECKER_OPEN: 'ticket_checker_open',
  /** A ticket was actually evaluated against published results. */
  TICKET_CHECK: 'ticket_check',
  /** A result/article was shared or its link copied. */
  RESULT_SHARE: 'result_share',
  /** A WhatsApp alerts CTA was clicked. */
  WHATSAPP_SUBSCRIPTION_CLICK: 'whatsapp_subscription_click',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Narrower value types used by the typed event helpers below. */
export type ShareMethod =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'copy_link'
  | 'native_share';

/** GA4 allows 25 parameters per event; anything past that is ignored anyway. */
const MAX_PARAM_COUNT = 25;

/**
 * GA4 truncates string values at 100 characters. Trimming here keeps the
 * payload honest about what the dashboard will actually receive.
 */
const MAX_PARAM_LENGTH = 100;

/**
 * How long a navigation waits for GA to accept the hit before giving up.
 *
 * Only used by events that are immediately followed by a page load; a user
 * never waits longer than this, and the timeout exists purely so a slow or
 * blocked `gtag.js` can never trap the visitor on the page.
 */
const NAVIGATION_GRACE_MS = 700;

/** Augmentations for the shim the layout installs in the document head. */
declare global {
  interface Window {
    /** Standard GA4 queue shim, installed by `BaseLayout.astro`. */
    gtag?: (...args: unknown[]) => void;
    /** Present as soon as the layout's head script runs. */
    dataLayer?: unknown[];
  }
}

/**
 * Reduces any caller input to a flat, GA4-safe parameter map.
 *
 * - `null`/`undefined` values are removed (GA would drop them anyway).
 * - Objects, arrays and functions are removed rather than stringified, so a
 *   whole record can never be attached to an event by accident.
 * - Strings are trimmed and truncated to the 100-character GA4 limit.
 * - Only the first {@link MAX_PARAM_COUNT} parameters survive.
 */
export function sanitizeAnalyticsParams(
  params?: AnalyticsParams
): Record<string, AnalyticsParamValue> {
  const clean: Record<string, AnalyticsParamValue> = {};
  if (!params) return clean;

  for (const [key, value] of Object.entries(params)) {
    if (Object.keys(clean).length >= MAX_PARAM_COUNT) break;
    if (value === null || value === undefined) continue;

    if (typeof value === 'number') {
      if (Number.isFinite(value)) clean[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      clean[key] = value;
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      clean[key] = trimmed.slice(0, MAX_PARAM_LENGTH);
      continue;
    }
    // Anything else (object, array, function, symbol) is intentionally dropped.
  }

  return clean;
}

/** True when GA is loaded or at least queued for loading on this document. */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Sends one GA4 event, or does nothing at all.
 *
 * Called from React islands (which run in the browser only) and from
 * `useEffect`s, so the guard is not theoretical: Astro renders these modules on
 * the server too. When the measurement ID is not configured the layout never
 * installs `window.gtag`, which makes every call on the site a silent no-op
 * instead of an error.
 *
 * There is deliberately no manual retry queue: the `dataLayer` the layout
 * creates *is* the queue, and GA replays it when `gtag.js` finishes loading.
 * Adding a second queue would risk sending an event twice.
 */
export function trackEvent(name: string, params?: AnalyticsParams): void {
  dispatch(name, params);
}

/**
 * Sends an event, then runs `after` once GA has accepted it.
 *
 * gtag.js processes `dataLayer` pushes on a later tick, so an event pushed in
 * the same tick as `window.location.assign()` is simply never sent — the
 * document is gone before GA reads the queue. Passing `after` moves the
 * navigation behind GA's own `event_callback`, which fires once the hit has
 * been dispatched (GA4 already uses the Beacon transport by default, so the
 * hit survives the unload without asking for it explicitly — and asking for it
 * would have been recorded as a bogus `transport_type` event parameter).
 * The timer is the safety net: GA being block-listed must slow the user down
 * for at most {@link NAVIGATION_GRACE_MS}, never break the navigation.
 */
function dispatch(
  name: string,
  params?: AnalyticsParams,
  after?: () => void,
  timeoutMs: number = NAVIGATION_GRACE_MS
): void {
  if (typeof window === 'undefined') {
    after?.();
    return;
  }

  const gtag = window.gtag;
  if (typeof gtag !== 'function') {
    // GA unavailable (no measurement ID configured, or blocked): the
    // interaction still has to work, so run the continuation immediately.
    after?.();
    return;
  }

  const cleaned = sanitizeAnalyticsParams(params);
  if (!after) {
    try {
      gtag('event', name, cleaned);
    } catch {
      // Analytics must never break a user interaction.
    }
    return;
  }

  let settled = false;
  const proceed = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    after();
  };

  const timer = setTimeout(proceed, timeoutMs);

  try {
    gtag('event', name, { ...cleaned, event_callback: proceed });
  } catch {
    proceed();
  }
}

/** Normalises a Date or ISO-ish string to the `YYYY-MM-DD` GA4 expects. */
export function toAnalyticsDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}

/** `PROVISIONAL` / `official` / undefined all become a lower-case label. */
function toVerificationStatus(value: string | null | undefined): string {
  return (value ?? 'OFFICIAL').toLowerCase();
}

export interface ResultViewInput {
  lotteryName: string;
  /** Draw date as a `Date` or an ISO string. */
  drawDate: string | Date;
  drawNumber?: string | null;
  /** `OFFICIAL` (gazette verified) or `PROVISIONAL` (live aggregator). */
  verificationStatus?: string | null;
}

/**
 * Builds the `result_view` payload.
 *
 * Split out from `trackResultView()` because result pages are rendered by Astro
 * with no island at all: the event is declared server-side and emitted by the
 * layout's single head script, which is both cheaper (no JS ships) and immune
 * to double-firing from hydration.
 */
export function resultViewEvent(input: ResultViewInput): AnalyticsEvent {
  return {
    name: ANALYTICS_EVENTS.RESULT_VIEW,
    // Sanitized here rather than at the layout, so a key that carries no value
    // (a draw without a number) is absent from the payload the page declares
    // instead of being serialized as `undefined`.
    params: sanitizeAnalyticsParams({
      lottery_name: input.lotteryName,
      draw_date: toAnalyticsDate(input.drawDate),
      draw_number: input.drawNumber ?? undefined,
      verification_status: toVerificationStatus(input.verificationStatus),
    }),
  };
}

/** Sends `result_view` from a client component (used when one is hydrated). */
export function trackResultView(input: ResultViewInput): void {
  const event = resultViewEvent(input);
  trackEvent(event.name, event.params);
}

/**
 * The homepage finder resolved a date/scheme pair into a result lookup.
 *
 * `after` is the navigation to the resolved result page. It is handed to GA as
 * the `event_callback` so the lookup is actually recorded before the document
 * that reports it disappears. See {@link dispatch}.
 */
export function trackHistoricalResultSearch(
  input: {
    selectedDate: string | Date;
    /** Human-readable scheme name, or `all` when every scheme was selected. */
    lotteryName?: string | null;
  },
  after?: () => void
): void {
  dispatch(
    ANALYTICS_EVENTS.HISTORICAL_RESULT_SEARCH,
    {
      selected_date: toAnalyticsDate(input.selectedDate),
      lottery_name: input.lotteryName?.trim() || 'all',
    },
    after
  );
}

/** The ticket checker was engaged for the first time in this document. */
export function trackTicketCheckerOpen(): void {
  trackEvent(ANALYTICS_EVENTS.TICKET_CHECKER_OPEN);
}

/**
 * A ticket lookup finished.
 *
 * Only the outcome is ever sent. The ticket number itself, the scheme code the
 * user typed and the matched prize amount stay in the browser — see the privacy
 * note at the top of this module.
 */
export function trackTicketCheck(input: {
  /** Human-readable scheme name, or `all` for an unfiltered check. */
  lotteryName?: string | null;
  /** Whether at least one ticket matched a published prize. */
  isWinner: boolean;
}): void {
  trackEvent(ANALYTICS_EVENTS.TICKET_CHECK, {
    lottery_name: input.lotteryName?.trim() || 'all',
    result: input.isWinner ? 'winner' : 'not_winner',
  });
}

/** A share affordance was used on a result or article page. */
export function trackResultShare(input: { method: ShareMethod }): void {
  trackEvent(ANALYTICS_EVENTS.RESULT_SHARE, { method: input.method });
}

/**
 * A WhatsApp alerts subscription CTA was clicked.
 *
 * `plan` is the subscription tier (e.g. `daily-draw-alerts`) and must never be
 * a phone number: KeralaDraws does not collect one for alerts.
 */
export function trackWhatsAppSubscriptionClick(input: {
  plan: string;
  lotteryName?: string | null;
}): void {
  trackEvent(ANALYTICS_EVENTS.WHATSAPP_SUBSCRIPTION_CLICK, {
    plan: input.plan,
    lottery_name: input.lotteryName?.trim() || 'all',
  });
}
