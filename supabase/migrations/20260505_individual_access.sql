-- Individual (one-person) access codes — без группы, без класса.
-- Один код = один человек, действует один раз, доступ на календарный месяц.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Расширяем profiles: новый тип доступа + срок индивидуального доступа
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_access_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_access_type_check
  CHECK (access_type IN ('pending','student','teacher','legacy_individual','individual'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Таблица одноразовых индивидуальных кодов
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS individual_codes (
  code TEXT PRIMARY KEY,
  note TEXT,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE individual_codes ENABLE ROW LEVEL SECURITY;
-- Доступ только через SECURITY DEFINER RPCs.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Pre-flight проверка кода (анонимная, до signUp)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_individual_code(p_code TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM individual_codes
    WHERE upper(code) = upper(btrim(p_code)) AND used_by IS NULL
  )
$$;

GRANT EXECUTE ON FUNCTION check_individual_code(TEXT) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Активация кода после signUp: помечает код, ставит access_type='individual'
--    и access_until = now() + 1 month (5 мая → 5 июня включительно).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION consume_individual_code(p_code TEXT) RETURNS TIMESTAMPTZ
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_norm TEXT;
  v_until TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501'; END IF;
  v_norm := upper(btrim(p_code));

  -- Лочим строку и проверяем, что код существует и не использован.
  PERFORM 1 FROM individual_codes
   WHERE upper(code) = v_norm AND used_by IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_individual_code';
  END IF;

  v_until := now() + interval '1 month';

  UPDATE individual_codes
     SET used_by = v_uid, used_at = now()
   WHERE upper(code) = v_norm;

  INSERT INTO profiles (user_id, access_type, access_until)
  VALUES (v_uid, 'individual', v_until)
  ON CONFLICT (user_id) DO UPDATE
    SET access_type = 'individual',
        access_until = v_until,
        updated_at = now();

  RETURN v_until;
END $$;

GRANT EXECUTE ON FUNCTION consume_individual_code(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Админ-функции: создание / список / удаление индивидуальных кодов
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_create_individual_code(
  p_note TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL
) RETURNS TEXT
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_code IS NULL OR btrim(p_code) = '' THEN
    v_code := 'IND-' ||
              upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6)) || '-' ||
              upper(substring(md5(random()::text || clock_timestamp()::text) FROM 7 FOR 6));
  ELSE
    v_code := upper(btrim(p_code));
  END IF;

  INSERT INTO individual_codes (code, note)
  VALUES (v_code, NULLIF(btrim(p_note), ''));
  RETURN v_code;
END $$;

GRANT EXECUTE ON FUNCTION admin_create_individual_code(TEXT,TEXT) TO authenticated;

DROP FUNCTION IF EXISTS admin_list_individual_codes();
CREATE OR REPLACE FUNCTION admin_list_individual_codes()
RETURNS TABLE(
  code TEXT,
  note TEXT,
  used_by UUID,
  used_by_email TEXT,
  used_at TIMESTAMPTZ,
  access_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT ic.code, ic.note, ic.used_by, u.email::text, ic.used_at,
           p.access_until,
           ic.created_at
      FROM individual_codes ic
      LEFT JOIN auth.users u ON u.id = ic.used_by
      LEFT JOIN profiles p   ON p.user_id = ic.used_by
     ORDER BY ic.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION admin_list_individual_codes() TO authenticated;

CREATE OR REPLACE FUNCTION admin_delete_individual_code(p_code TEXT)
RETURNS VOID
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM individual_codes WHERE code = upper(btrim(p_code)) AND used_by IS NULL;
END $$;

GRANT EXECUTE ON FUNCTION admin_delete_individual_code(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
