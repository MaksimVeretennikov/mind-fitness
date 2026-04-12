import { supabase } from './supabase';

/**
 * Saves an exercise result for the currently logged-in user.
 * Silently does nothing if no user is authenticated.
 */
export async function saveResult(
  exerciseName: string,
  score: number,
  details: Record<string, unknown> = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('exercise_results').insert({
    user_id: user.id,
    exercise_name: exerciseName,
    score,
    details,
  });
}
