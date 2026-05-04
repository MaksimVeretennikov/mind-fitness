import { supabase } from './supabase';

export interface TeacherCodeRow {
  code: string;
  student_limit: number;
  note: string | null;
  used_by: string | null;
  used_by_email: string | null;
  used_at: string | null;
  created_at: string;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  owner_email: string | null;
  student_limit: number;
  member_count: number;
  created_at: string;
}

export async function adminCreateTeacherCode(
  studentLimit: number,
  note: string | null,
  customCode: string | null,
): Promise<{ code?: string; error?: string }> {
  const { data, error } = await supabase.rpc('admin_create_teacher_code', {
    p_student_limit: studentLimit,
    p_note: note,
    p_code: customCode,
  });
  if (error) {
    if (error.code === '23505') return { error: 'Такой код уже существует' };
    return { error: error.message || 'Не удалось создать код' };
  }
  return { code: data as string };
}

export async function adminListTeacherCodes(): Promise<TeacherCodeRow[]> {
  const { data, error } = await supabase.rpc('admin_list_teacher_codes');
  if (error) {
    console.error('[adminListTeacherCodes]', error);
    return [];
  }
  return (data as TeacherCodeRow[]) ?? [];
}

export async function adminDeleteTeacherCode(code: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_delete_teacher_code', { p_code: code });
  return error ? error.message || 'Не удалось удалить код' : null;
}

export async function adminListGroups(): Promise<AdminGroupRow[]> {
  const { data, error } = await supabase.rpc('admin_list_groups');
  if (error) {
    console.error('[adminListGroups]', error);
    return [];
  }
  return (data as AdminGroupRow[]) ?? [];
}

export async function adminUpdateGroupLimit(
  groupId: string,
  newLimit: number,
): Promise<string | null> {
  const { error } = await supabase.rpc('admin_update_group_limit', {
    p_group_id: groupId,
    p_new_limit: newLimit,
  });
  return error ? error.message || 'Не удалось обновить лимит' : null;
}
