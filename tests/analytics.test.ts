import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ANALYTICS_EVENTS,
  resultViewEvent,
  sanitizeAnalyticsParams,
  toAnalyticsDate,
  trackEvent,
  trackHistoricalResultSearch,
  trackResultShare,
  trackResultView,
  trackTicketCheck,
  trackTicketCheckerOpen,
  trackWhatsAppSubscriptionClick,
} from '../lib/analytics';

const projectRoot = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(projectRoot, rel), 'utf8');

/** Collects everything the utility hands to GA. */
function withBrowserGtag() {
  const calls: Array<[unknown, unknown, unknown]> = [];
  const gtag = (...args: unknown[]) => {
    calls.push(args as [unknown, unknown, unknown]);
  };
  (globalThis as any).window = { gtag };
  return calls;
}

afterEach(() => {
  delete (globalThis as any).window;
});

describe('GA4 event vocabulary', () => {
  it('defines exactly the six bespoke events, with GA4-legal names', () => {
    expect(Object.values(ANALYTICS_EVENTS).sort()).toEqual(
      [
        'historical_result_search',
        'result_share',
        'result_view',
        'ticket_check',
        'ticket_checker_open',
        'whatsapp_subscription_click',
      ].sort()
    );
  });

  it('does not re-create Google enhanced-measurement events', () => {
    const names = Object.values(ANALYTICS_EVENTS) as string[];
    // scroll / outbound click / site search / video / file download / page_view
    // are all sent by Enhanced Measurement on the GA4 web stream. Re-creating
    // them would double-count.
    for (const covered of ['page_view', 'scroll', 'click', 'view_search_results', 'file_download']) {
      expect(names).not.toContain(covered);
    }
  });
});

describe('trackEvent SSR + availability safety', () => {
  it('is a silent no-op during server rendering', () => {
    expect(typeof window).toBe('undefined');
    expect(() => trackEvent('result_view', { lottery_name: 'Karunya' })).not.toThrow();
  });

  it('does nothing when GA is not configured on the page', () => {
    (globalThis as any).window = {};
    expect(() =>
      trackEvent(ANALYTICS_EVENTS.TICKET_CHECK, { result: 'winner' })
    ).not.toThrow();
  });

  it('forwards a sanitized payload once GA is available', () => {
    const calls = withBrowserGtag();
    trackEvent('result_view', { lottery_name: 'Suvarna Keralam', draw_number: 5 });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      'event',
      'result_view',
      { lottery_name: 'Suvarna Keralam', draw_number: 5 },
    ]);
  });

  it('never throws when GA itself explodes', () => {
    (globalThis as any).window = {
      gtag: () => {
        throw new Error('blocked by an extension');
      },
    };
    expect(() => trackEvent('result_view')).not.toThrow();
  });
});

describe('sanitizeAnalyticsParams', () => {
  it('drops nulls, undefined and empty strings', () => {
    expect(
      sanitizeAnalyticsParams({ a: null, b: undefined, c: '', d: '  ', e: 'ok' })
    ).toEqual({ e: 'ok' });
  });

  it('drops anything that is not a primitive, so no record can be attached', () => {
    const params = sanitizeAnalyticsParams({
      object: { phone: '+91 90000 00000' } as any,
      array: ['123456'] as any,
      fn: (() => 'x') as any,
      keep: true,
    });

    expect(params).toEqual({ keep: true });
  });

  it('drops non-finite numbers and truncates long strings to the GA4 limit', () => {
    const params = sanitizeAnalyticsParams({
      nan: Number.NaN,
      inf: Number.POSITIVE_INFINITY,
      long: 'x'.repeat(300),
    });

    expect(params.nan).toBeUndefined();
    expect(params.inf).toBeUndefined();
    expect(String(params.long)).toHaveLength(100);
  });

  it('caps the parameter count at the GA4 maximum', () => {
    const oversized = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`p${i}`, i])
    );
    expect(Object.keys(sanitizeAnalyticsParams(oversized))).toHaveLength(25);
  });
});

describe('result_view', () => {
  it('normalizes a Date and defaults an unknown verification status to official', () => {
    const event = resultViewEvent({
      lotteryName: 'Karunya Plus',
      drawDate: new Date('2026-10-07T09:30:00.000Z'),
      drawNumber: 'KN-512',
    });

    expect(event).toEqual({
      name: 'result_view',
      params: {
        lottery_name: 'Karunya Plus',
        draw_date: '2026-10-07',
        draw_number: 'KN-512',
        verification_status: 'official',
      },
    });
  });

  it('lower-cases a PROVISIONAL draw so the two trust tiers are separable', () => {
    const event = resultViewEvent({
      lotteryName: 'Suvarna Keralam',
      drawDate: '2026-10-07T00:00:00.000Z',
      drawNumber: 'SK-42',
      verificationStatus: 'PROVISIONAL',
    });

    expect(event.params?.verification_status).toBe('provisional');
  });

  it('sends exactly the four documented parameters', () => {
    const event = resultViewEvent({
      lotteryName: 'Karunya',
      drawDate: '2026-10-07',
      drawNumber: 'KR-1',
      verificationStatus: 'OFFICIAL',
    });

    expect(Object.keys(event.params ?? {}).sort()).toEqual([
      'draw_date',
      'draw_number',
      'lottery_name',
      'verification_status',
    ]);
  });

  it('omits a missing draw number instead of sending an empty string', () => {
    const event = resultViewEvent({ lotteryName: 'Karunya', drawDate: '2026-10-07' });
    expect(event.params).not.toHaveProperty('draw_number');
  });

  it('reports through gtag when a hydrated component calls it', () => {
    const calls = withBrowserGtag();
    trackResultView({
      lotteryName: 'Karunya',
      drawDate: '2026-10-07',
      drawNumber: 'KR-1',
      verificationStatus: 'OFFICIAL',
    });

    expect(calls[0][0]).toBe('event');
    expect(calls[0][1]).toBe('result_view');
  });

  it('returns an empty string rather than "Invalid Date" for bad input', () => {
    expect(toAnalyticsDate(new Date('nonsense'))).toBe('');
    expect(toAnalyticsDate(undefined)).toBe('');
  });
});

describe('historical_result_search', () => {
  it('sends the selected date and scheme name', () => {
    const calls = withBrowserGtag();
    trackHistoricalResultSearch({
      selectedDate: '2026-09-28',
      lotteryName: 'Suvarna Keralam',
    });

    expect(calls[0]).toEqual([
      'event',
      'historical_result_search',
      { selected_date: '2026-09-28', lottery_name: 'Suvarna Keralam' },
    ]);
  });

  it('falls back to `all` when no scheme was chosen', () => {
    const calls = withBrowserGtag();
    trackHistoricalResultSearch({ selectedDate: '2026-09-28' });

    expect((calls[0][2] as Record<string, unknown>).lottery_name).toBe('all');
  });

  it('never blocks the navigation when GA is unavailable', () => {
    const navigations: string[] = [];
    trackHistoricalResultSearch({ selectedDate: '2026-09-28' }, () => navigations.push('go'));

    expect(navigations).toEqual(['go']);
  });

  it('holds the navigation until GA has accepted the hit', () => {
    const calls = withBrowserGtag();
    const navigations: string[] = [];
    trackHistoricalResultSearch(
      { selectedDate: '2026-09-28', lotteryName: 'Karunya' },
      () => navigations.push('go')
    );

    // gtag.js reads the queue on a later tick, so navigating here is what used
    // to lose the hit entirely.
    expect(navigations).toEqual([]);

    const params = calls[0][2] as Record<string, any>;
    // `event_callback` is GA's own control key, not a custom parameter: it is
    // the only non-parameter key in the payload (a `transport_type` here would
    // be reported by GA as an `ep.transport_type` custom parameter).
    expect(Object.keys(params).sort()).toEqual([
      'event_callback',
      'lottery_name',
      'selected_date',
    ]);
    expect(typeof params.event_callback).toBe('function');

    params.event_callback();
    expect(navigations).toEqual(['go']);

    // A second callback (GA retrying) must not navigate twice.
    params.event_callback();
    expect(navigations).toEqual(['go']);
  });

  it('releases the visitor after the grace period even if GA never answers', () => {
    vi.useFakeTimers();
    try {
      (globalThis as any).window = { gtag: () => {} };
      const navigations: string[] = [];
      trackHistoricalResultSearch(
        { selectedDate: '2026-09-28' },
        () => navigations.push('go')
      );

      expect(navigations).toEqual([]);
      vi.advanceTimersByTime(700);
      expect(navigations).toEqual(['go']);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('ticket_check privacy', () => {
  it('reports only winner / not_winner plus the scheme name', () => {
    const calls = withBrowserGtag();
    trackTicketCheck({ lotteryName: 'Karunya', isWinner: true });
    trackTicketCheck({ lotteryName: 'Karunya', isWinner: false });

    expect(calls[0][2]).toEqual({ lottery_name: 'Karunya', result: 'winner' });
    expect(calls[1][2]).toEqual({ lottery_name: 'Karunya', result: 'not_winner' });
  });

  it('cannot leak a ticket number: the input type has no field for it', () => {
    const calls = withBrowserGtag();
    // Simulates a careless future call site trying to add the looked-up number.
    trackTicketCheck({
      lotteryName: 'Karunya',
      isWinner: false,
      ticketNumber: '320327',
      series: 'PS',
    } as any);

    const params = calls[0][2] as Record<string, unknown>;
    expect(Object.keys(params).sort()).toEqual(['lottery_name', 'result']);
    expect(JSON.stringify(params)).not.toContain('320327');
  });

  it('counts an open exactly once even if the handler runs repeatedly', () => {
    const calls = withBrowserGtag();
    trackTicketCheckerOpen();

    expect(calls[0]).toEqual(['event', 'ticket_checker_open', {}]);
  });
});

describe('sharing and WhatsApp alerts', () => {
  it('result_share reports the method', () => {
    const calls = withBrowserGtag();
    trackResultShare({ method: 'whatsapp' });

    expect(calls[0]).toEqual(['event', 'result_share', { method: 'whatsapp' }]);
  });

  it('whatsapp_subscription_click reports the plan, never a phone number', () => {
    const calls = withBrowserGtag();
    trackWhatsAppSubscriptionClick({
      plan: 'daily-draw-alerts',
      lotteryName: 'Karunya',
    });

    const params = calls[0][2] as Record<string, unknown>;
    expect(params).toEqual({ plan: 'daily-draw-alerts', lottery_name: 'Karunya' });
    expect(Object.keys(params).sort()).toEqual(['lottery_name', 'plan']);
  });
});

describe('single GA loader contract', () => {
  const layout = read('astro/layouts/BaseLayout.astro');

  it('reads the measurement ID from the environment and never hardcodes it', () => {
    expect(layout).toContain('import.meta.env.PUBLIC_GA_MEASUREMENT_ID');
    expect(layout).not.toMatch(/G-[A-Z0-9]{8,}/);
  });

  it('configures GA exactly once, with the built-in page_view', () => {
    // Two `config` calls (or a manual page_view) is what produces the duplicate
    // page_view this task had to avoid.
    expect(layout.match(/gtag\('config'/g)).toHaveLength(1);
    expect(layout).toContain('send_page_view: true');
    expect(layout).not.toMatch(/gtag\('event',\s*'page_view'/);
  });

  it('installs the dataLayer shim synchronously but defers only the request', () => {
    expect(layout).toContain('window.dataLayer');
    expect(layout).toContain('requestIdleCallback');
    // The tag itself is never created inline: it is appended after idle or the
    // first interaction, which is what keeps it off the critical path.
    expect(layout).not.toMatch(/<script[^>]+src="https:\/\/www\.googletagmanager\.com/);
  });

  it('loads gtag.js from the layout only, never from a page', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.astro') && full.replace(projectRoot, '') !== '/astro/layouts/BaseLayout.astro') {
          if (/googletagmanager|gtag\(|GTM-/.test(read(full.replace(`${projectRoot}/`, '')))) {
            offenders.push(full.replace(`${projectRoot}/`, ''));
          }
        }
      }
    };
    walk(path.join(projectRoot, 'astro'));

    expect(offenders).toEqual([]);
  });

  it('uses the direct GA4 tag and no Google Tag Manager container', () => {
    const sources = ['astro/layouts/BaseLayout.astro', 'lib/analytics.ts'].map(read);
    for (const source of sources) {
      expect(source).not.toMatch(/GTM-[A-Z0-9]+/);
      expect(source).not.toContain('gtm.js');
    }
  });

  it('emits server-declared events as inert JSON, not as JavaScript', () => {
    expect(layout).toContain('id="kd-analytics-events"');
    expect(layout).toContain('application/json');
    // Escaping `<` is what stops a scheme name from closing the script early.
    expect(layout).toContain(".replace(/</g, '\\\\u003c')");
  });
});

describe('event call sites are real interactions', () => {
  it('the finder reports the lookup at the moment it navigates', () => {
    const finder = read('components/ResultFinder.tsx');
    expect(finder).toContain('trackHistoricalResultSearch');
    expect(finder.indexOf('trackHistoricalResultSearch')).toBeLessThan(
      finder.indexOf('window.location.assign')
    );
  });

  it('the ticket checker guards its open event with a ref', () => {
    const checker = read('components/TicketChecker.tsx');
    expect(checker).toContain('checkerOpenedRef');
    expect(checker).toContain('onFocusCapture={markCheckerOpened}');
    // Both the single lookup and the batch scan report exactly one outcome.
    expect(checker.match(/trackTicketCheck\(/g)).toHaveLength(2);
  });

  it('the share bar reports once per tap, including the Web Share fallback', () => {
    const bar = read('components/ResultShareBar.tsx');
    // The clipboard write is separated from its reporting so the fallback path
    // cannot emit both `native_share` and `copy_link` for one tap.
    expect(bar).toContain('const copyLink = () =>');
    expect(bar.match(/trackResultShare\(/g)).toHaveLength(5);
  });
});
