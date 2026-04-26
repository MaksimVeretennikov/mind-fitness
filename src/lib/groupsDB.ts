import { supabase } from './supabase';

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  display_name: string | null;
  nickname: string | null;
  email: string | null;
  joined_at: string;
}

export interface ExerciseResult {
  id: string;
  user_id: string;
  exercise_name: string;
  score: number;
  details: Record<string, unknown>;
  created_at: string;
}

/** Fetch the group owned by the current user (if any). Single group per owner in current UI. */
export async function getMyOwnedGroup(userId: string): Promise<Group | null> {
  const { data } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Group) ?? null;
}

/** Fetch the group this user has joined as a student (if any). */
export async function getMyMembership(
  userId: string,
): Promise<{ group: Group; member: GroupMember } | null> {
  const { data: memberRow } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!memberRow) return null;
  const m = memberRow as GroupMember;
  const { data: groupRow } = await supabase
    .from('groups')
    .select('*')
    .eq('id', m.group_id)
    .maybeSingle();
  if (!groupRow) return null;
  return { group: groupRow as Group, member: m };
}

export async function createGroup(
  ownerId: string,
  name: string,
  code: string,
): Promise<{ group?: Group; error?: string }> {
  const trimmedName = name.trim();
  const trimmedCode = code.trim();
  if (!trimmedName) return { error: 'Укажите название группы' };
  if (!trimmedCode) return { error: 'Укажите код группы' };

  const { data, error } = await supabase
    .from('groups')
    .insert({ owner_id: ownerId, name: trimmedName, code: trimmedCode })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'Такой код уже занят — выбери другой' };
    return { error: 'Не удалось создать группу' };
  }
  return { group: data as Group };
}

export async function joinGroupByCode(
  userId: string,
  code: string,
  displayName: string | null,
  email: string | null,
): Promise<{ group?: Group; error?: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { error: 'Введите код группы' };

  const { data: groupRow, error: lookupError } = await supabase
    .from('groups')
    .select('*')
    .eq('code', trimmed)
    .maybeSingle();
  if (lookupError || !groupRow) return { error: 'Группа с таким кодом не найдена' };
  const group = groupRow as Group;

  if (group.owner_id === userId) return { error: 'Это ваша группа — вы уже её владелец' };

  const { error: upsertError } = await supabase
    .from('group_members')
    .upsert({
      user_id: userId,
      group_id: group.id,
      display_name: displayName,
      email,
    });

  if (upsertError) return { error: 'Не удалось присоединиться к группе' };
  return { group };
}

export async function leaveGroup(userId: string): Promise<void> {
  await supabase.from('group_members').delete().eq('user_id', userId);
}

export async function updateMemberNickname(userId: string, nickname: string): Promise<string | null> {
  const { error } = await supabase
    .from('group_members')
    .update({ nickname: nickname.trim() || null })
    .eq('user_id', userId);
  return error ? 'Не удалось сохранить ник' : null;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });
  return (data as GroupMember[]) ?? [];
}

/** All exercise results for given user ids. Relies on RLS allowing the teacher to read them. */
export async function getResultsForUsers(userIds: string[]): Promise<ExerciseResult[]> {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from('exercise_results')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(5000);
  return (data as ExerciseResult[]) ?? [];
}

export interface RankingEntry {
  user_id: string;
  display_name: string | null;
  total_score: number;
}

/** Per-member scores and last login time (from streaks table — one lightweight query). */
export interface MemberMeta {
  score: number;
  lastLogin: string | null;
}

/** Fetch member scores + last-login for all members of a group.
 *  Uses a SECURITY DEFINER RPC to bypass streaks RLS (owner-only table). */
export async function getMemberMeta(groupId: string): Promise<Map<string, MemberMeta>> {
  const { data } = await supabase.rpc('get_member_meta', { p_group_id: groupId });
  const map = new Map<string, MemberMeta>();
  for (const row of (data ?? []) as { user_id: string; total_score: number; last_login: string | null }[]) {
    map.set(row.user_id, { score: row.total_score ?? 0, lastLogin: row.last_login ?? null });
  }
  return map;
}

/** Fetch paginated results for a single student. */
export async function getResultsForUser(
  userId: string,
  offset: number,
  limit = 50,
): Promise<{ results: ExerciseResult[]; hasMore: boolean }> {
  const { data } = await supabase
    .from('exercise_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  const results = (data as ExerciseResult[]) ?? [];
  return { results, hasMore: results.length === limit };
}

/**
 * Ranking for the group owner — delegates to the same SECURITY DEFINER RPC
 * used by students, which now reads total_score directly from streaks.
 */
export async function getGroupRankingDirect(groupId: string): Promise<RankingEntry[]> {
  return getGroupRanking(groupId);
}

/** Group ranking via secure RPC — for group members (students). */
export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('get_group_ranking', { p_group_id: groupId });
  if (error) { console.error('[getGroupRanking]', error); return []; }
  if (!data) return [];
  return data as RankingEntry[];
}
