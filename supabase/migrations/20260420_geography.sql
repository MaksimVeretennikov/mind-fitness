-- Per-country progress for geography exercises (spaced repetition).
-- Sessions themselves are stored in the generic `exercise_results` table.

CREATE TABLE IF NOT EXISTS geography_country_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('map', 'capitals')),
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, country_code, exercise_type)
);

ALTER TABLE geography_country_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own geography_country_progress"
  ON geography_country_progress;

CREATE POLICY "Users manage own geography_country_progress"
  ON geography_country_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
