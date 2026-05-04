-- Access control: profiles, one-time teacher codes, group student limits, consents.
-- Gating logic for new users (must register via teacher or class code).
-- Existing users are grandfathered: teachers keep ownership, members keep access,
-- everyone else becomes 'legacy_individual' with free access.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Profiles: per-user access type + consent timestamps + marketing opt-in
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL DEFAULT 'pending'
    CHECK (access_type IN ('pending','student','teacher','legacy_individual')),
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own profile" ON profiles;
CREATE POLICY "User reads own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User updates own profile" ON profiles;
CREATE POLICY "User updates own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Teacher registration codes (one-time)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_codes (
  code TEXT PRIMARY KEY,
  student_limit INT NOT NULL CHECK (student_limit > 0),
  note TEXT,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE teacher_codes ENABLE ROW LEVEL SECURITY;
-- All access goes through SECURITY DEFINER RPCs; no direct RLS access granted.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add per-group student limit
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE groups ADD COLUMN IF NOT EXISTS student_limit INT NOT NULL DEFAULT 10;

-- Tighten direct INSERT on groups: no longer allowed via REST.
-- New groups must be created through consume_teacher_code RPC.
DROP POLICY IF EXISTS "Owner manages own groups" ON groups;
CREATE POLICY "Owner reads own groups" ON groups
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner updates own groups" ON groups
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes own groups" ON groups
  FOR DELETE USING (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Admin helper
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'maksim.veretennik@gmail.com'
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Auto-create profile on user signup (reads consents from raw_user_meta_data)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user_profile() RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_marketing BOOLEAN;
  v_terms TIMESTAMPTZ;
  v_privacy TIMESTAMPTZ;
BEGIN
  v_marketing := coalesce((NEW.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false);
  v_terms := CASE WHEN coalesce((NEW.raw_user_meta_data ->> 'terms_accepted')::boolean, false)
                  THEN now() ELSE NULL END;
  v_privacy := CASE WHEN coalesce((NEW.raw_user_meta_data ->> 'privacy_accepted')::boolean, false)
                    THEN now() ELSE NULL END;

  INSERT INTO profiles (user_id, access_type, marketing_opt_in, terms_accepted_at, privacy_accepted_at)
  VALUES (NEW.id, 'pending', v_marketing, v_terms, v_privacy)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Teacher signup: consume one-time code, create group with limit
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION consume_teacher_code(
  p_teacher_code TEXT,
  p_group_name TEXT,
  p_class_code TEXT
) RETURNS UUID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_limit INT;
  v_group_id UUID;
  v_norm_tcode TEXT;
  v_norm_class TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501'; END IF;

  v_norm_tcode := upper(btrim(p_teacher_code));
  v_norm_class := btrim(p_class_code);

  IF length(btrim(p_group_name)) < 1 THEN
    RAISE EXCEPTION 'invalid_group_name';
  END IF;

  -- Class code: 6–20 ascii alnum chars, must contain at least one letter and one digit.
  IF v_norm_class !~ '^[A-Za-z0-9]{6,20}$'
     OR v_norm_class !~ '[A-Za-z]'
     OR v_norm_class !~ '[0-9]' THEN
    RAISE EXCEPTION 'invalid_class_code_format';
  END IF;

  -- One owned group per teacher.
  IF EXISTS (SELECT 1 FROM groups WHERE owner_id = v_uid) THEN
    RAISE EXCEPTION 'teacher_already_has_group';
  END IF;

  -- Class code uniqueness (case-insensitive).
  IF EXISTS (SELECT 1 FROM groups WHERE upper(code) = upper(v_norm_class)) THEN
    RAISE EXCEPTION 'class_code_taken';
  END IF;

  -- Lock and validate teacher code.
  SELECT student_limit INTO v_limit
  FROM teacher_codes
  WHERE upper(code) = v_norm_tcode AND used_by IS NULL
  FOR UPDATE;

  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'invalid_teacher_code';
  END IF;

  -- Create group (bypasses RLS thanks to SECURITY DEFINER).
  INSERT INTO groups (owner_id, name, code, student_limit)
  VALUES (v_uid, btrim(p_group_name), upper(v_norm_class), v_limit)
  RETURNING id INTO v_group_id;

  -- Mark code consumed.
  UPDATE teacher_codes
  SET used_by = v_uid, used_at = now()
  WHERE upper(code) = v_norm_tcode;

  -- Promote profile.
  INSERT INTO profiles (user_id, access_type)
  VALUES (v_uid, 'teacher')
  ON CONFLICT (user_id) DO UPDATE
    SET access_type = 'teacher', updated_at = now();

  RETURN v_group_id;
END $$;

GRANT EXECUTE ON FUNCTION consume_teacher_code(TEXT,TEXT,TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Student signup: join group by class code (with limit check)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION join_group_by_class_code(
  p_class_code TEXT,
  p_display_name TEXT
) RETURNS UUID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_group_id UUID;
  v_owner UUID;
  v_limit INT;
  v_count INT;
  v_already_member BOOLEAN;
  v_norm TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501'; END IF;
  v_norm := btrim(p_class_code);

  SELECT id, owner_id, student_limit INTO v_group_id, v_owner, v_limit
  FROM groups WHERE upper(code) = upper(v_norm)
  FOR UPDATE;

  IF v_group_id IS NULL THEN RAISE EXCEPTION 'class_code_not_found'; END IF;
  IF v_owner = v_uid THEN RAISE EXCEPTION 'cannot_join_own_group'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM group_members WHERE user_id = v_uid AND group_id = v_group_id
  ) INTO v_already_member;

  -- Block joining if currently a member of a different group.
  IF NOT v_already_member AND EXISTS (
    SELECT 1 FROM group_members WHERE user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_in_other_group';
  END IF;

  IF NOT v_already_member THEN
    SELECT count(*) INTO v_count FROM group_members WHERE group_id = v_group_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'group_full';
    END IF;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  INSERT INTO group_members (user_id, group_id, display_name, email)
  VALUES (v_uid, v_group_id, p_display_name, v_email)
  ON CONFLICT (user_id) DO UPDATE
    SET group_id = excluded.group_id,
        display_name = excluded.display_name,
        email = excluded.email;

  INSERT INTO profiles (user_id, access_type)
  VALUES (v_uid, 'student')
  ON CONFLICT (user_id) DO UPDATE
    SET access_type = 'student', updated_at = now();

  RETURN v_group_id;
END $$;

GRANT EXECUTE ON FUNCTION join_group_by_class_code(TEXT,TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Marketing opt-in toggle (user-controlled)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_marketing_opt_in(p_value BOOLEAN)
RETURNS VOID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501'; END IF;
  UPDATE profiles SET marketing_opt_in = p_value, updated_at = now()
  WHERE user_id = v_uid;
END $$;

GRANT EXECUTE ON FUNCTION update_marketing_opt_in(BOOLEAN) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Public validation RPCs (used at the registration screen before signUp)
-- ─────────────────────────────────────────────────────────────────────────────
-- These do NOT consume anything; they only report whether a code is usable.
-- Granted to anon so the AuthScreen can pre-validate before creating an
-- account. Class codes and teacher codes are gates, not secrets.

CREATE OR REPLACE FUNCTION check_teacher_code(p_code TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM teacher_codes
    WHERE upper(code) = upper(btrim(p_code)) AND used_by IS NULL
  )
$$;

GRANT EXECUTE ON FUNCTION check_teacher_code(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION class_code_exists(p_code TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM groups WHERE upper(code) = upper(btrim(p_code))
  )
$$;

GRANT EXECUTE ON FUNCTION class_code_exists(TEXT) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Admin RPCs (gated by is_admin())
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_create_teacher_code(
  p_student_limit INT,
  p_note TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL
) RETURNS TEXT
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_student_limit IS NULL OR p_student_limit < 1 THEN RAISE EXCEPTION 'invalid_limit'; END IF;
  IF p_code IS NULL OR btrim(p_code) = '' THEN
    -- Generate compact human-typeable code: TCH-XXXXXX-XXXXXX (12 hex chars).
    -- Uses md5(random()) which is in core Postgres — no pgcrypto needed.
    v_code := 'TCH-' ||
              upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6)) || '-' ||
              upper(substring(md5(random()::text || clock_timestamp()::text) FROM 7 FOR 6));
  ELSE
    v_code := upper(btrim(p_code));
  END IF;

  INSERT INTO teacher_codes (code, student_limit, note)
  VALUES (v_code, p_student_limit, NULLIF(btrim(p_note), ''));
  RETURN v_code;
END $$;

GRANT EXECUTE ON FUNCTION admin_create_teacher_code(INT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION admin_list_teacher_codes()
RETURNS TABLE(
  code TEXT,
  student_limit INT,
  note TEXT,
  used_by UUID,
  used_by_email TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT tc.code, tc.student_limit, tc.note, tc.used_by, u.email::text, tc.used_at, tc.created_at
    FROM teacher_codes tc
    LEFT JOIN auth.users u ON u.id = tc.used_by
    ORDER BY tc.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION admin_list_teacher_codes() TO authenticated;

CREATE OR REPLACE FUNCTION admin_delete_teacher_code(p_code TEXT)
RETURNS VOID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM teacher_codes WHERE code = upper(btrim(p_code)) AND used_by IS NULL;
END $$;

GRANT EXECUTE ON FUNCTION admin_delete_teacher_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION admin_list_groups()
RETURNS TABLE(
  id UUID,
  name TEXT,
  code TEXT,
  owner_id UUID,
  owner_email TEXT,
  student_limit INT,
  member_count BIGINT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT g.id, g.name, g.code, g.owner_id, u.email::text, g.student_limit,
           (SELECT count(*) FROM group_members gm WHERE gm.group_id = g.id),
           g.created_at
    FROM groups g
    LEFT JOIN auth.users u ON u.id = g.owner_id
    ORDER BY g.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION admin_list_groups() TO authenticated;

CREATE OR REPLACE FUNCTION admin_update_group_limit(p_group_id UUID, p_new_limit INT)
RETURNS VOID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_new_limit IS NULL OR p_new_limit < 1 THEN RAISE EXCEPTION 'invalid_limit'; END IF;
  UPDATE groups SET student_limit = p_new_limit WHERE id = p_group_id;
END $$;

GRANT EXECUTE ON FUNCTION admin_update_group_limit(UUID, INT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Backfill existing users → profiles
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO profiles (user_id, access_type, terms_accepted_at, privacy_accepted_at, created_at, updated_at)
SELECT
  u.id,
  CASE
    WHEN EXISTS (SELECT 1 FROM groups g WHERE g.owner_id = u.id) THEN 'teacher'
    WHEN EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = u.id) THEN 'student'
    ELSE 'legacy_individual'
  END,
  u.created_at, u.created_at, u.created_at, u.created_at
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Backfill student_limit for legacy groups (≥30, with slack above current size)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE groups g
SET student_limit = GREATEST(
  30,
  ((SELECT count(*) FROM group_members gm WHERE gm.group_id = g.id)::int + 5)
)
WHERE g.created_at < now() - interval '1 minute';

NOTIFY pgrst, 'reload schema';
