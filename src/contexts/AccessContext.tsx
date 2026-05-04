import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getProfile, type Profile, type AccessType, isAdminEmail } from '../lib/access';

interface AccessContextValue {
  profile: Profile | null;
  accessType: AccessType | null; // null = unknown / loading
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    const p = await getProfile(user.id);
    setProfile(p);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isAdmin = isAdminEmail(user?.email);

  return (
    <AccessContext.Provider
      value={{
        profile,
        accessType: profile?.access_type ?? null,
        isAdmin,
        loading,
        refresh,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used inside AccessProvider');
  return ctx;
}
