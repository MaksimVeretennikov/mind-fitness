import { supabase } from './supabase';

// ─── localStorage keys ────────────────────────────────────────────────────────
const KEY_LAST_VISIT = 'mf-streak-last-visit';
const KEY_COUNT      = 'mf-streak-count';
const KEY_BEST       = 'mf-streak-best';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StreakData {
  count: number;
  best: number;
  lastVisit: string | null; // YYYY-MM-DD
}

export interface StreakState {
  count: number;
  best: number;
  showWelcome: boolean;
  changed: 'new' | 'incremented' | 'reset' | 'same-day';
}

// ─── Pure date math ───────────────────────────────────────────────────────────
export function formatDate(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function diffDays(lastVisit: string, now: Date): number {
  const [y, m, d] = lastVisit.split('-').map(Number);
  const aUtc = Date.UTC(y, m - 1, d);
  const bUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((bUtc - aUtc) / (24 * 60 * 60 * 1000));
}

/**
 * Pure computation: given previous stored data and the current time,
 * return the new StreakData and UI state. Does NOT touch any storage.
 */
export function computeStreak(
  prev: StreakData,
  now: Date = new Date(),
): { data: StreakData; state: StreakState } {
  const today = formatDate(now);

  if (prev.lastVisit === today) {
    return {
      data: prev,
      state: { count: prev.count, best: prev.best, showWelcome: false, changed: 'same-day' },
    };
  }

  let count: number;
  let changed: StreakState['changed'];

  if (!prev.lastVisit) {
    count   = 1;
    changed = 'new';
  } else {
    const gap = diffDays(prev.lastVisit, now);
    if (gap === 1) {
      count   = prev.count + 1;
      changed = 'incremented';
    } else {
      count   = 1;
      changed = 'reset';
    }
  }

  const best = Math.max(prev.best, count);
  return {
    data:  { count, best, lastVisit: today },
    state: { count, best, showWelcome: true, changed },
  };
}

// ─── localStorage backend ─────────────────────────────────────────────────────
export function loadFromLS(): StreakData {
  return {
    count:     Number(localStorage.getItem(KEY_COUNT) || '0') || 0,
    best:      Number(localStorage.getItem(KEY_BEST)  || '0') || 0,
    lastVisit: localStorage.getItem(KEY_LAST_VISIT),
  };
}

export function saveToLS(data: StreakData): void {
  if (data.lastVisit) localStorage.setItem(KEY_LAST_VISIT, data.lastVisit);
  localStorage.setItem(KEY_COUNT, String(data.count));
  localStorage.setItem(KEY_BEST,  String(data.best));
}

// ─── Supabase backend ─────────────────────────────────────────────────────────
export async function loadFromDB(userId: string): Promise<StreakData | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('count, best, last_visit')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    count:     data.count,
    best:      data.best,
    lastVisit: data.last_visit, // 'YYYY-MM-DD' from Postgres DATE column
  };
}

export async function saveToDB(userId: string, d: StreakData): Promise<void> {
  await supabase.from('streaks').upsert(
    {
      user_id:    userId,
      count:      d.count,
      best:       d.best,
      last_visit: d.lastVisit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

/** Points awarded for a login on the given streak day (50 normally; +50 bonus every 7th day). */
export function loginBonus(count: number): number {
  return count % 7 === 0 ? 50 * (2 + count / 7) : 50;
}

/** Atomically add delta to total_score in streaks. Fire-and-forget. */
export async function incrementTotalScore(userId: string, delta: number): Promise<void> {
  await supabase.rpc('increment_total_score', { p_user_id: userId, p_delta: delta });
}
