import { IST_OFFSET_MS } from '@/lib/date';

/**
 * The single source of truth for "what state is today's draw in?".
 *
 * This used to be computed in three different places with three different
 * rules — the SSR homepage loader, `/api/results/today` and the hero component —
 * and they disagreed. The visible symptom was a page stuck on
 * "RESULT BEING UPDATED" with a spinner: the homepage payload never carried
 * `secondsUntilDraw`, so the client countdown initialised to 0, which is also the
 * value that means "the draw has started, keep spinning". Nothing ever corrected
 * it until a background refetch happened to land.
 *
 * The second bug was the window itself: anything after 15:00 IST was "checking",
 * so the homepage spun from 3 PM until midnight, every day, even when the result
 * was simply never published. A spinner is an honest signal *during* the draw
 * and its publication window; outside it, saying "not published yet" is honest
 * and a spinner is a lie.
 */

export type LiveStatus =
  /** Before the draw: a countdown is the correct thing to show. */
  | 'WAITING'
  /** Draw is running / gazette is imminent: an update in progress is honest. */
  | 'CHECKING'
  /** The publication window has closed and today's result never arrived. */
  | 'DELAYED'
  /** Today's draw is stored and verified. */
  | 'PUBLISHED';

export const DRAW_HOUR_IST = 15;
/**
 * End of the live window in IST. The draw is at 15:00, live numbers appear from
 * ~14:55, and the official gazette lands around 16:30-17:00 but can slip. After
 * 19:00 the day's result is late rather than "in progress".
 */
export const LIVE_WINDOW_END_HOUR_IST = 19;

export const EXPECTED_DRAW_TIME = '03:00:00 PM';

/**
 * Formats an already-IST-shifted Date as `YYYY-MM-DD`.
 *
 * `computeLiveState` used to call `getTodayIstStr()` for `todayDate`, which
 * reads the wall clock and ignores the `now` argument. The weekday, however, was
 * derived from `now` — so injecting a date returned a date/weekday pair that
 * could belong to two different days. Production always passes the real clock,
 * so the pair matched there and the bug only surfaced in tests.
 */
function toIstDateStr(ist: Date): string {
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface LiveState {
  isTodayAvailable: boolean;
  liveStatus: LiveStatus;
  /** Seconds until the 15:00 IST draw; 0 once the draw has started or when published. */
  secondsUntilDraw: number;
  expectedDrawTime: string;
  /** Today's date in IST, `YYYY-MM-DD`. */
  todayDate: string;
  /** Weekday name in IST, used to find the scheduled scheme. */
  todayDayOfWeek: string;
  currentIstTime: { hours: number; minutes: number; seconds: number };
}

export function computeLiveState(isPublished: boolean, now: Date = new Date()): LiveState {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const seconds = ist.getUTCSeconds();

  const secondsIntoDay = hours * 3600 + minutes * 60 + seconds;
  const secondsUntilDraw = isPublished
    ? 0
    : Math.max(0, DRAW_HOUR_IST * 3600 - secondsIntoDay);

  let liveStatus: LiveStatus;
  if (isPublished) {
    liveStatus = 'PUBLISHED';
  } else if (secondsUntilDraw > 0) {
    liveStatus = 'WAITING';
  } else if (hours < LIVE_WINDOW_END_HOUR_IST) {
    liveStatus = 'CHECKING';
  } else {
    liveStatus = 'DELAYED';
  }

  return {
    isTodayAvailable: isPublished,
    liveStatus,
    secondsUntilDraw,
    expectedDrawTime: EXPECTED_DRAW_TIME,
    todayDate: toIstDateStr(ist),
    todayDayOfWeek: DAYS_OF_WEEK[ist.getUTCDay()],
    currentIstTime: { hours, minutes, seconds },
  };
}

/**
 * True while it is worth actively polling for a result: the draw has started and
 * the publication window has not closed yet. Used to decide whether a client
 * should keep revalidating.
 */
export function isWithinLiveWindow(now: Date = new Date()): boolean {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours() >= DRAW_HOUR_IST && ist.getUTCHours() < LIVE_WINDOW_END_HOUR_IST;
}
