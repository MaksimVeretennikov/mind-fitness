import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  getMyOwnedGroup,
  getMyMembership,
  leaveGroup as dbLeaveGroup,
  updateMemberNickname as dbUpdateNickname,
  type Group,
} from '../lib/groupsDB';
import { joinGroupByClassCodeRpc } from '../lib/access';

interface GroupContextValue {
  ownedGroup: Group | null;
  memberGroup: Group | null;
  memberNickname: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  joinByCode: (code: string) => Promise<string | null>;
  leave: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<string | null>;
  // UI state
  showGroupModal: boolean;
  setShowGroupModal: (v: boolean) => void;
  showTeacherDashboard: boolean;
  setShowTeacherDashboard: (v: boolean) => void;
  showGroupRanking: boolean;
  setShowGroupRanking: (v: boolean) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ownedGroup, setOwnedGroup] = useState<Group | null>(null);
  const [memberGroup, setMemberGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberNickname, setMemberNickname] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
  const [showGroupRanking, setShowGroupRanking] = useState(false);

  // Like AccessContext.refresh — reads the live session so post-signUp
  // refreshes don't race with the AuthContext listener.
  const refresh = useCallback(async () => {
    const { data: { user: liveUser } } = await supabase.auth.getUser();
    if (!liveUser) {
      setOwnedGroup(null);
      setMemberGroup(null);
      setMemberNickname(null);
      return;
    }
    setLoading(true);
    const [owned, membership] = await Promise.all([
      getMyOwnedGroup(liveUser.id),
      getMyMembership(liveUser.id),
    ]);
    setOwnedGroup(owned);
    setMemberGroup(membership?.group ?? null);
    setMemberNickname(membership?.member.nickname ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

  const joinByCode = useCallback(
    async (code: string): Promise<string | null> => {
      if (!user) return 'Войдите в аккаунт';
      const displayName =
        ((user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          (user.email?.split('@')[0]) ||
          'Ученик');
      const { error } = await joinGroupByClassCodeRpc(code, displayName);
      if (error) return error;
      // Refresh memberGroup from DB so we pick up the canonical row + student_limit.
      const membership = await getMyMembership(user.id);
      setMemberGroup(membership?.group ?? null);
      setMemberNickname(membership?.member.nickname ?? null);
      return null;
    },
    [user],
  );

  const leave = useCallback(async () => {
    if (!user) return;
    await dbLeaveGroup(user.id);
    setMemberGroup(null);
    setMemberNickname(null);
  }, [user]);

  const updateNickname = useCallback(async (nickname: string): Promise<string | null> => {
    if (!user) return 'Войдите в аккаунт';
    const error = await dbUpdateNickname(user.id, nickname);
    if (!error) setMemberNickname(nickname.trim() || null);
    return error;
  }, [user]);

  return (
    <GroupContext.Provider
      value={{
        ownedGroup,
        memberGroup,
        memberNickname,
        loading,
        refresh,
        joinByCode,
        leave,
        updateNickname,
        showGroupModal,
        setShowGroupModal,
        showTeacherDashboard,
        setShowTeacherDashboard,
        showGroupRanking,
        setShowGroupRanking,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider');
  return ctx;
}
