-- Add total_score to streaks — tracks cumulative Russian-language score per user.
-- Incremented on each Russian exercise completion and on daily login bonus.

ALTER TABLE streaks ADD COLUMN IF NOT EXISTS total_score INT NOT NULL DEFAULT 0;

-- Backfill: sum correct*10 from existing Russian exercise results
UPDATE streaks
SET total_score = COALESCE(sub.score, 0)
FROM (
  SELECT
    user_id,
    SUM(COALESCE((details->>'correct')::int, 0) * 10) AS score
  FROM exercise_results
  WHERE exercise_name IN (
    'adverbs', 'prefixes', 'spelling-nn', 'word-forms', 'stress', 'abbreviations'
  )
  GROUP BY user_id
) sub
WHERE streaks.user_id = sub.user_id;

-- Atomic increment for total_score (called from client after each exercise and login).
CREATE OR REPLACE FUNCTION increment_total_score(p_user_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO streaks (user_id, count, best, last_visit, updated_at, total_score)
  VALUES (p_user_id, 0, 0, CURRENT_DATE, NOW(), p_delta)
  ON CONFLICT (user_id) DO UPDATE
    SET total_score = streaks.total_score + p_delta;
END;
$$;

-- Replace get_group_ranking RPC: now reads total_score directly from streaks.
-- Much faster than aggregating exercise_results. Same auth check as before.
CREATE OR REPLACE FUNCTION get_group_ranking(p_group_id UUID)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  total_score  INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_caller
  ) AND NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND owner_id = v_caller
  ) THEN
    RETURN;
  END IF;

  SET LOCAL row_security = off;

  RETURN QUERY
  SELECT
    gm.user_id,
    COALESCE(gm.nickname, gm.display_name)::TEXT AS display_name,
    COALESCE(s.total_score, 0)                   AS total_score
  FROM group_members gm
  LEFT JOIN streaks s ON s.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY total_score DESC;
END;
$$;
