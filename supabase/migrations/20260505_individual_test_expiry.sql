-- Админ-функция для теста: установить срок доступа индивидуальному пользователю
-- через N минут от сейчас. Удобно проверять flow «доступ истёк».

CREATE OR REPLACE FUNCTION admin_set_individual_access_minutes(
  p_code TEXT,
  p_minutes INT
) RETURNS TIMESTAMPTZ
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_user UUID;
  v_until TIMESTAMPTZ;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_minutes IS NULL THEN RAISE EXCEPTION 'invalid_minutes'; END IF;

  SELECT used_by INTO v_user
    FROM individual_codes
   WHERE upper(code) = upper(btrim(p_code));

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'code_not_used_yet';
  END IF;

  v_until := now() + make_interval(mins => p_minutes);

  UPDATE profiles
     SET access_until = v_until,
         updated_at = now()
   WHERE user_id = v_user;

  RETURN v_until;
END $$;

GRANT EXECUTE ON FUNCTION admin_set_individual_access_minutes(TEXT,INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
