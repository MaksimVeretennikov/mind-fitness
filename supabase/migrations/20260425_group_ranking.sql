-- Group ranking: RPC function that returns mastery stats per member.
-- Accessible to group members (students) and group owner (teacher).
-- Mastery score = correct² / total  (rewards accuracy × volume, penalises wrong answers).
--
-- SECURITY DEFINER runs as the function owner (postgres / supabase_admin) which
-- has bypassrls. We disable row_security locally after the explicit auth check so
-- the inner queries are not blocked by any RLS policy on exercise_results or group_members.

CREATE OR REPLACE FUNCTION get_group_ranking(p_group_id UUID)
RETURNS TABLE (
  user_id        UUID,
  display_name   TEXT,
  mastery_score  FLOAT,
  accuracy_pct   FLOAT,
  total_attempts BIGINT,
  total_correct  FLOAT,
  total_questions FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  -- Capture uid() before any query so it reads the JWT in the right context
  IF v_caller IS NULL THEN
    RETURN;
  END IF;

  -- Caller must be a group member or the group owner
  IF NOT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_caller
  ) AND NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND owner_id = v_caller
  ) THEN
    RETURN;
  END IF;

  -- Bypass RLS for the data queries — auth check above ensures only authorised callers proceed
  SET LOCAL row_security = off;

  RETURN QUERY
  WITH ru_results AS (
    SELECT
      er.user_id,
      COALESCE((er.details->>'correct')::float, 0) AS correct,
      COALESCE((er.details->>'total')::float,   0) AS total
    FROM exercise_results er
    WHERE er.user_id IN (
      SELECT gm.user_id FROM group_members gm WHERE gm.group_id = p_group_id
    )
    AND er.exercise_name IN (
      'adverbs','prefixes','spelling-nn','word-forms','stress','abbreviations'
    )
    AND (er.details->>'total')::float > 0
  ),
  member_stats AS (
    SELECT
      r.user_id,
      SUM(r.correct)  AS sum_correct,
      SUM(r.total)    AS sum_total,
      COUNT(*)        AS num_attempts
    FROM ru_results r
    GROUP BY r.user_id
  )
  SELECT
    ms.user_id,
    gm.display_name,
    CASE WHEN ms.sum_total > 0
      THEN (ms.sum_correct * ms.sum_correct) / ms.sum_total
      ELSE 0
    END                                            AS mastery_score,
    CASE WHEN ms.sum_total > 0
      THEN ms.sum_correct / ms.sum_total * 100
      ELSE 0
    END                                            AS accuracy_pct,
    ms.num_attempts,
    ms.sum_correct,
    ms.sum_total
  FROM member_stats ms
  JOIN group_members gm ON gm.user_id = ms.user_id AND gm.group_id = p_group_id
  ORDER BY mastery_score DESC;
END;
$$;
