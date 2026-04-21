-- Teacher groups: owners (teachers) create groups, students join via code.

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS groups_owner_idx ON groups(owner_id);

CREATE TABLE IF NOT EXISTS group_members (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- groups: owner full access; members can SELECT their group
DROP POLICY IF EXISTS "Owner manages own groups" ON groups;
CREATE POLICY "Owner manages own groups" ON groups
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- NOTE: we intentionally do NOT add a "members can read their group" policy
-- that references group_members. Combined with the group_members policy that
-- references groups, it causes infinite recursion in Postgres RLS planning
-- (42P17). The "authenticated can SELECT groups" policy below covers the
-- member read case without cross-reference.

-- Allow anyone authenticated to look up a group by code (needed for join flow).
-- We intentionally expose id/name/code; no sensitive data here.
DROP POLICY IF EXISTS "Anyone can read groups for join lookup" ON groups;
CREATE POLICY "Anyone can read groups for join lookup" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- group_members: user manages own row; group owner reads all members of their groups
DROP POLICY IF EXISTS "User manages own membership" ON group_members;
CREATE POLICY "User manages own membership" ON group_members
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner reads members of own groups" ON group_members;
CREATE POLICY "Owner reads members of own groups" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
  );

-- Allow group owner to read exercise_results of their members.
-- Adds a SELECT policy alongside the existing owner-only policy on exercise_results.
DROP POLICY IF EXISTS "Group owner reads member results" ON exercise_results;
CREATE POLICY "Group owner reads member results" ON exercise_results
  FOR SELECT USING (
    user_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE g.owner_id = auth.uid()
    )
  );
