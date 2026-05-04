import { supabase } from './supabase';

export type AccessType = 'pending' | 'student' | 'teacher' | 'legacy_individual';

export interface Profile {
  user_id: string;
  access_type: AccessType;
  marketing_opt_in: boolean;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ADMIN_EMAIL = 'maksim.veretennik@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/**
 * Validate class code format on the client (mirrors server-side regex).
 * Returns localized error or null if valid.
 */
export function validateClassCode(code: string): string | null {
  const trimmed = code.trim();
  if (trimmed.length < 6 || trimmed.length > 20) {
    return 'Код класса должен быть длиной от 6 до 20 символов';
  }
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return 'Код класса может содержать только латинские буквы и цифры';
  }
  if (!/[A-Za-z]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return 'Код класса должен содержать минимум одну букву и одну цифру';
  }
  return null;
}

function translateRpcError(code: string | undefined, message: string): string {
  const m = `${code ?? ''} ${message}`.toLowerCase();
  if (m.includes('invalid_teacher_code')) return 'Код учителя неверный или уже использован';
  if (m.includes('teacher_already_has_group')) return 'У этого аккаунта уже есть созданная группа';
  if (m.includes('class_code_taken')) return 'Такой код класса уже занят — выберите другой';
  if (m.includes('invalid_class_code_format')) return 'Неверный формат кода класса';
  if (m.includes('invalid_group_name')) return 'Укажите название группы';
  if (m.includes('class_code_not_found')) return 'Группа с таким кодом не найдена';
  if (m.includes('cannot_join_own_group')) return 'Это ваша группа — вы её владелец';
  if (m.includes('already_in_other_group')) return 'Вы уже состоите в другой группе';
  if (m.includes('group_full')) return 'В этой группе закончились свободные места — обратитесь к учителю';
  if (m.includes('unauthorized')) return 'Сессия истекла, войдите заново';
  if (m.includes('forbidden')) return 'Доступ запрещён';
  return 'Не удалось выполнить операцию';
}

export async function consumeTeacherCode(
  teacherCode: string,
  groupName: string,
  classCode: string,
): Promise<{ groupId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('consume_teacher_code', {
    p_teacher_code: teacherCode,
    p_group_name: groupName,
    p_class_code: classCode,
  });
  if (error) return { error: translateRpcError(error.code, error.message) };
  return { groupId: data as string };
}

export async function joinGroupByClassCodeRpc(
  classCode: string,
  displayName: string,
): Promise<{ groupId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('join_group_by_class_code', {
    p_class_code: classCode,
    p_display_name: displayName,
  });
  if (error) return { error: translateRpcError(error.code, error.message) };
  return { groupId: data as string };
}

export async function setMarketingOptIn(value: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('update_marketing_opt_in', { p_value: value });
  return error ? translateRpcError(error.code, error.message) : null;
}

/** Pre-flight check: is this teacher code valid and unused? Callable anonymously. */
export async function checkTeacherCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_teacher_code', { p_code: code });
  if (error) return false;
  return data === true;
}

/** Pre-flight check: does this class code map to an existing group? Callable anonymously. */
export async function checkClassCodeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('class_code_exists', { p_code: code });
  if (error) return false;
  return data === true;
}

// ─── Pending signup intent stash ───────────────────────────────────────────
// When email confirmation is enabled, signUp returns no session and we cannot
// immediately consume the code. We persist the user's intent locally so that
// JoinGroupScreen (which runs after first sign-in) can pre-fill and finish.

export type PendingSignup =
  | { role: 'student'; classCode: string; displayName: string }
  | { role: 'teacher'; teacherCode: string; groupName: string; classCode: string };

const STASH_KEY = 'mind-fitness-pending-signup';

export function stashPendingSignup(p: PendingSignup): void {
  try { localStorage.setItem(STASH_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
export function readPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(STASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (parsed && (parsed.role === 'student' || parsed.role === 'teacher')) return parsed;
    return null;
  } catch { return null; }
}
export function clearPendingSignup(): void {
  try { localStorage.removeItem(STASH_KEY); } catch { /* ignore */ }
}
