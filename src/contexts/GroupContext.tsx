import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getMyOwnedGroup,
  getMyMembership,
  createGroup as dbCreateGroup,
  joinGroupByCode as dbJoinGroupByCode,
  leaveGroup as dbLeaveGroup,
  type Group,
} from '../lib/groupsDB';

interface GroupContextValue {
  ownedGroup: Group | null;
  memberGroup: Group | null;
  loading: boolean;
  refresh: () => Promise<void>;
  createGroup: (name: string, code: string) => Promise<string | null>;
  joinByCode: (code: string) => Promise<string | null>;
  leave: () => Promise<void>;
  // UI state
  showGroupModal: boolean;
  setShowGroupModal: (v: boolean) => void;
  showTeacherDashboard: boolean;
  setShowTeacherDashboard: (v: boolean) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ownedGroup, setOwnedGroup] = useState<Group | null>(null);
  const [memberGroup, setMemberGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setOwnedGroup(null);
      setMemberGroup(null);
      return;
    }
    setLoading(true);
    const [owned, membership] = await Promise.all([
      getMyOwnedGroup(user.id),
      getMyMembership(user.id),
    ]);
    setOwnedGroup(owned);
    setMemberGroup(membership?.group ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGroup = useCallback(
    async (name: string, code: string): Promise<string | null> => {
      if (!user) return 'Войдите в аккаунт';
      const { group, error } = await dbCreateGroup(user.id, name, code);
      if (error) return error;
      setOwnedGroup(group ?? null);
      return null;
    },
    [user],
  );

  const joinByCode = useCallback(
    async (code: string): Promise<string | null> => {
      if (!user) return 'Войдите в аккаунт';
      const displayName =
        ((user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null) ?? null;
      const { group, error } = await dbJoinGroupByCode(
        user.id,
        code,
        displayName,
        user.email ?? null,
      );
      if (error) return error;
      setMemberGroup(group ?? null);
      return null;
    },
    [user],
  );

  const leave = useCallback(async () => {
    if (!user) return;
    await dbLeaveGroup(user.id);
    setMemberGroup(null);
  }, [user]);

  return (
    <GroupContext.Provider
      value={{
        ownedGroup,
        memberGroup,
        loading,
        refresh,
        createGroup,
        joinByCode,
        leave,
        showGroupModal,
        setShowGroupModal,
        showTeacherDashboard,
        setShowTeacherDashboard,
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
