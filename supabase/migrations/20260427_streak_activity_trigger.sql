-- Fix "last active" time in teacher dashboard.
--
-- Root cause: increment_total_score ON CONFLICT never updated streaks.updated_at,
-- so it stayed frozen at the initial INSERT time (first login ever).
--
-- Three-part fix:
-- 1. Fix increment_total_score: add updated_at = NOW() in ON CONFLICT.
-- 2. Trigger on exercise_results: keeps updated_at current for all exercises
--    (including non-Russian ones that never call increment_total_score).
-- 3. Backfill: fix stale updated_at for existing rows from exercise history.

-- 1. Fix increment_total_score
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
    SET total_score = streaks.total_score + p_delta,
        updated_at  = NOW();
END;
$$;

-- 2. Trigger: update streaks.updated_at on every exercise completion
CREATE OR REPLACE FUNCTION update_streak_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO streaks (user_id, count, best, last_visit, updated_at, total_score)
  VALUES (NEW.user_id, 0, 0, CURRENT_DATE, NEW.created_at, 0)
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = NEW.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exercise_results_last_active ON exercise_results;
CREATE TRIGGER trg_exercise_results_last_active
AFTER INSERT ON exercise_results
FOR EACH ROW EXECUTE FUNCTION update_streak_last_active();

-- 3. Backfill: set updated_at to actual last exercise time for existing rows
UPDATE streaks s
SET updated_at = sub.last_at
FROM (
  SELECT user_id, MAX(created_at) AS last_at
  FROM exercise_results
  GROUP BY user_id
) sub
WHERE s.user_id = sub.user_id
  AND sub.last_at > s.updated_at;
