-- Add separate nickname column for group ranking display.
-- display_name stays as real name (shown in teacher dashboard).
-- nickname is the custom alias shown in the ranking leaderboard.
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS nickname TEXT;
