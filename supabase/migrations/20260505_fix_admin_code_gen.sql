-- Fix: admin_create_teacher_code() called gen_random_bytes() from pgcrypto,
-- which is installed in the `extensions` schema on Supabase but not on the
-- default search_path. Replace with md5(random()) — pure core Postgres,
-- no extensions required. The format becomes TCH-XXXXXX-XXXXXX (12 hex
-- chars; ~10^14 combinations, no realistic collision risk).

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

NOTIFY pgrst, 'reload schema';
