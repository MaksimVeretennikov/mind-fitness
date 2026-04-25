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
  mastery_score: number;
  accuracy_pct: number;
  total_attempts: number;
  total_correct: number;
  total_questions: number;
}

const RU_EXERCISE_NAMES = [
  'adverbs', 'prefixes', 'spelling-nn', 'word-forms', 'stress', 'abbreviations',
] as const;

/**
 * Compute ranking client-side for the group owner (teacher).
 * Uses the existing RLS policy that lets the owner read all member results.
 */
export async function getGroupRankingDirect(groupId: string): Promise<RankingEntry[]> {
  const members = await getGroupMembers(groupId);
  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data } = await supabase
    .from('exercise_results')
    .select('user_id, details')
    .in('user_id', userIds)
    .in('exercise_name', RU_EXERCISE_NAMES as unknown as string[]);

  if (!data) return [];

  const statsMap = new Map<string, { correct: number; total: number; attempts: number }>();
  for (const r of data as { user_id: string; details: Record<string, unknown> }[]) {
    const correct = Number(r.details?.correct ?? 0);
    const total = Number(r.details?.total ?? 0);
    if (total === 0) continue;
    const prev = statsMap.get(r.user_id) ?? { correct: 0, total: 0, attempts: 0 };
    statsMap.set(r.user_id, {
      correct: prev.correct + correct,
      total: prev.total + total,
      attempts: prev.attempts + 1,
    });
  }

  const entries: RankingEntry[] = [];
  for (const [userId, stats] of statsMap) {
    const member = members.find((m) => m.user_id === userId);
    entries.push({
      user_id: userId,
      display_name: member?.display_name ?? null,
      mastery_score: stats.total > 0 ? (stats.correct * stats.correct) / stats.total : 0,
      accuracy_pct: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      total_attempts: stats.attempts,
      total_correct: stats.correct,
      total_questions: stats.total,
    });
  }
  return entries.sort((a, b) => b.total_correct - a.total_correct);
}

/** Group ranking via secure RPC — for group members (students). */
export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('get_group_ranking', { p_group_id: groupId });
  if (error) { console.error('[getGroupRanking]', error); return []; }
  if (!data) return [];
  return data as RankingEntry[];
}
