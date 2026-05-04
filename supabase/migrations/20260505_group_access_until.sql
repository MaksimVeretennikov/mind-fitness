-- Group access expiration:
--   NULL access_until  → бессрочный доступ (legacy / grandfathered)
--   timestamp          → доступ действует до этой даты, далее ежемесячное продление
--
-- Existing groups стартуют с NULL — то есть остаются бессрочными.
-- Новые группы, создаваемые через consume_teacher_code, получают +1 месяц.

ALTER TABLE groups ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ;

-- Update consume_teacher_code: новые группы → access_until = now() + 1 month.
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

  IF v_norm_class !~ '^[A-Za-z0-9]{6,20}$'
     OR v_norm_class !~ '[A-Za-z]'
     OR v_norm_class !~ '[0-9]' THEN
    RAISE EXCEPTION 'invalid_class_code_format';
  END IF;

  IF EXISTS (SELECT 1 FROM groups WHERE owner_id = v_uid) THEN
    RAISE EXCEPTION 'teacher_already_has_group';
  END IF;

  IF EXISTS (SELECT 1 FROM groups WHERE upper(code) = upper(v_norm_class)) THEN
    RAISE EXCEPTION 'class_code_taken';
  END IF;

  SELECT student_limit INTO v_limit
  FROM teacher_codes
  WHERE upper(code) = v_norm_tcode AND used_by IS NULL
  FOR UPDATE;

  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'invalid_teacher_code';
  END IF;

  INSERT INTO groups (owner_id, name, code, student_limit, access_until)
  VALUES (v_uid, btrim(p_group_name), upper(v_norm_class), v_limit, now() + interval '1 month')
  RETURNING id INTO v_group_id;

  UPDATE teacher_codes
  SET used_by = v_uid, used_at = now()
  WHERE upper(code) = v_norm_tcode;

  INSERT INTO profiles (user_id, access_type)
  VALUES (v_uid, 'teacher')
  ON CONFLICT (user_id) DO UPDATE
    SET access_type = 'teacher', updated_at = now();

  RETURN v_group_id;
END $$;

GRANT EXECUTE ON FUNCTION consume_teacher_code(TEXT,TEXT,TEXT) TO authenticated;

-- Admin listing с access_until. Return type изменился → нужно дропнуть старую.
DROP FUNCTION IF EXISTS admin_list_groups();
CREATE OR REPLACE FUNCTION admin_list_groups()
RETURNS TABLE(
  id UUID,
  name TEXT,
  code TEXT,
  owner_id UUID,
  owner_email TEXT,
  student_limit INT,
  member_count BIGINT,
  access_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT g.id, g.name, g.code, g.owner_id, u.email::text, g.student_limit,
           (SELECT count(*) FROM group_members gm WHERE gm.group_id = g.id),
           g.access_until,
           g.created_at
    FROM groups g
    LEFT JOIN auth.users u ON u.id = g.owner_id
    ORDER BY g.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION admin_list_groups() TO authenticated;

NOTIFY pgrst, 'reload schema';
