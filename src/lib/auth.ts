import { supabase } from './supabase';
import { incrementTotalScore } from './streak';

/**
 * Saves an exercise result for the currently logged-in user.
 * Pass ruScore to also credit that many points to total_score (Russian exercises only).
 * Silently does nothing if no user is authenticated.
 */
export async function saveResult(
  exerciseName: string,
  score: number,
  details: Record<string, unknown> = {},
  ruScore?: number,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('exercise_results').insert({
    user_id: user.id,
    exercise_name: exerciseName,
    score,
    details,
  });

  if (ruScore && ruScore > 0) {
    incrementTotalScore(user.id, ruScore); // fire-and-forget
  }
}
