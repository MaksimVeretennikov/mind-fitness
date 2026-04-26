-- RPC for teacher dashboard: returns total_score + last_login per member.
-- Uses SECURITY DEFINER to bypass RLS on streaks (owner-only table).
-- Restricted to the group owner only.

CREATE OR REPLACE FUNCTION get_member_meta(p_group_id UUID)
RETURNS TABLE (
  user_id     UUID,
  total_score INT,
  last_login  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RETURN; END IF;

  -- Only the group owner may call this
  IF NOT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND owner_id = v_caller
  ) THEN
    RETURN;
  END IF;

  SET LOCAL row_security = off;

  RETURN QUERY
  SELECT
    gm.user_id,
    COALESCE(s.total_score, 0)::INT AS total_score,
    s.updated_at                     AS last_login
  FROM group_members gm
  LEFT JOIN streaks s ON s.user_id = gm.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;
