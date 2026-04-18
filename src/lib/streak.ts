const KEY_LAST_VISIT = 'mf-streak-last-visit';
const KEY_COUNT = 'mf-streak-count';
const KEY_BEST = 'mf-streak-best';

export interface StreakState {
  count: number;
  best: number;
  showWelcome: boolean;
  changed: 'new' | 'incremented' | 'reset' | 'same-day';
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function diffDays(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUtc - aUtc) / ms);
}

export function resolveStreak(now: Date = new Date()): StreakState {
  const today = formatDate(now);
  const lastRaw = localStorage.getItem(KEY_LAST_VISIT);
  const last = lastRaw ? parseDate(lastRaw) : null;
  const prevCount = Number(localStorage.getItem(KEY_COUNT) || '0') || 0;
  const prevBest = Number(localStorage.getItem(KEY_BEST) || '0') || 0;

  if (last && formatDate(last) === today) {
    return { count: prevCount, best: prevBest, showWelcome: false, changed: 'same-day' };
  }

  let count: number;
  let changed: StreakState['changed'];
  if (!last) {
    count = 1;
    changed = 'new';
  } else {
    const gap = diffDays(last, now);
    if (gap === 1) {
      count = prevCount + 1;
      changed = 'incremented';
    } else {
      count = 1;
      changed = 'reset';
    }
  }

  const best = Math.max(prevBest, count);

  localStorage.setItem(KEY_LAST_VISIT, today);
  localStorage.setItem(KEY_COUNT, String(count));
  localStorage.setItem(KEY_BEST, String(best));

  return { count, best, showWelcome: true, changed };
}
