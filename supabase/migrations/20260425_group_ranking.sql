-- Group ranking: RPC function that returns mastery stats per member.
-- Accessible to group members (students) and group owner (teacher).
-- Mastery score = correct² / total  (rewards accuracy × volume, penalises wrong answers).

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
BEGIN
  -- Caller must be a group member or the group owner
  IF NOT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND owner_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

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
