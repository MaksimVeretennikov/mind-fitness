import { supabase } from './supabase';

export type GeoExerciseType = 'map' | 'capitals';

export interface CountryProgressRow {
  country_code: string;
  exercise_type: GeoExerciseType;
  times_shown: number;
  times_correct: number;
  last_seen: string;
}

/**
 * Upsert-style progress update. Fetches the existing row, increments counters,
 * and writes back. Silently no-ops for unauthenticated users.
 */
export async function updateCountryProgress(
  countryCode: string,
  exerciseType: GeoExerciseType,
  wasCorrect: boolean,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('geography_country_progress')
    .select('times_shown, times_correct')
    .eq('user_id', user.id)
    .eq('country_code', countryCode)
    .eq('exercise_type', exerciseType)
    .maybeSingle();

  const times_shown = (existing?.times_shown ?? 0) + 1;
  const times_correct = (existing?.times_correct ?? 0) + (wasCorrect ? 1 : 0);

  await supabase
    .from('geography_country_progress')
    .upsert({
      user_id: user.id,
      country_code: countryCode,
      exercise_type: exerciseType,
      times_shown,
      times_correct,
      last_seen: new Date().toISOString(),
    });
}

/**
 * Batch-update progress for many answers at once (end-of-session).
 */
export async function updateCountryProgressBatch(
  exerciseType: GeoExerciseType,
  answers: { countryCode: string; correct: boolean }[],
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Aggregate per-country in case the same country appeared twice.
  const agg = new Map<string, { shown: number; correct: number }>();
  for (const a of answers) {
    const cur = agg.get(a.countryCode) ?? { shown: 0, correct: 0 };
    cur.shown += 1;
    if (a.correct) cur.correct += 1;
    agg.set(a.countryCode, cur);
  }
  const codes = Array.from(agg.keys());
  if (codes.length === 0) return;

  const { data: existingRows } = await supabase
    .from('geography_country_progress')
    .select('country_code, times_shown, times_correct')
    .eq('user_id', user.id)
    .eq('exercise_type', exerciseType)
    .in('country_code', codes);

  const existingMap = new Map<string, { times_shown: number; times_correct: number }>();
  for (const r of existingRows ?? []) {
    existingMap.set(r.country_code, { times_shown: r.times_shown, times_correct: r.times_correct });
  }

  const now = new Date().toISOString();
  const rows = codes.map(code => {
    const prev = existingMap.get(code) ?? { times_shown: 0, times_correct: 0 };
    const delta = agg.get(code)!;
    return {
      user_id: user.id,
      country_code: code,
      exercise_type: exerciseType,
      times_shown: prev.times_shown + delta.shown,
      times_correct: prev.times_correct + delta.correct,
      last_seen: now,
    };
  });

  await supabase.from('geography_country_progress').upsert(rows);
}

/**
 * Returns codes of countries the user answers worst (lowest ratio).
 * Requires at least `minShown` attempts per country to count.
 */
export async function getWeakCountries(
  exerciseType: GeoExerciseType,
  limit = 20,
  minShown = 2,
): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('geography_country_progress')
    .select('country_code, times_shown, times_correct')
    .eq('user_id', user.id)
    .eq('exercise_type', exerciseType);

  if (!data) return [];

  const ranked = data
    .filter(r => r.times_shown >= minShown)
    .map(r => ({
      code: r.country_code,
      ratio: r.times_correct / r.times_shown,
      shown: r.times_shown,
    }))
    .sort((a, b) => a.ratio - b.ratio || b.shown - a.shown)
    .slice(0, limit);

  return ranked.map(r => r.code);
}
