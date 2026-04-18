-- Streak table: one row per user, updated on each daily visit
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  count      INT  NOT NULL DEFAULT 1,
  best       INT  NOT NULL DEFAULT 1,
  last_visit DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security: users read and write only their own row
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_insert" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);
