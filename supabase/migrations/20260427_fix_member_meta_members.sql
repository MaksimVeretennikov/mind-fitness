-- Fix get_member_meta: two bugs + add display_name.
--
-- Bug 1 (42702): bare "user_id" in the member-check subquery was ambiguous
--   because RETURNS TABLE declares "user_id" as a PL/pgSQL output variable.
--   Fix: use table-aliased references (g.id, gm2.group_id, gm2.user_id).
--
-- Bug 2 (empty ranking for students): getGroupRankingDirect called
--   getGroupMembers first, which RLS limits to the student's own row.
--   Fix: add display_name to the RPC return so the ranking can be built
--   from this single SECURITY DEFINER call, bypassing the RLS limitation.
--
-- Access: allowed for group owner OR any group member.

CREATE OR REPLACE FUNCTION get_member_meta(p_group_id UUID)
RETURNS TABLE (
  user_id      UUID,
  total_score  INT,
  last_login   TIMESTAMPTZ,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RETURN; END IF;

  -- Allow group owner OR any group member (all column refs aliased to avoid
  -- conflict with the "user_id" output variable declared in RETURNS TABLE)
  IF NOT EXISTS (
    SELECT 1 FROM groups g WHERE g.id = p_group_id AND g.owner_id = v_caller
  ) AND NOT EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = p_group_id AND gm2.user_id = v_caller
  ) THEN
    RETURN;
  END IF;

  SET LOCAL row_security = off;

  RETURN QUERY
  SELECT
    gm.user_id,
    COALESCE(s.total_score, 0)::INT,
    s.updated_at,
    COALESCE(gm.nickname, gm.display_name)
  FROM group_members gm
  LEFT JOIN streaks s ON s.user_id = gm.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;
