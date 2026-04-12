-- Run this SQL in your Supabase project:
-- Dashboard → SQL Editor → New query → paste and run

CREATE TABLE exercise_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  exercise_name text NOT NULL,
  score integer,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own results" ON exercise_results
  FOR ALL USING (auth.uid() = user_id);
