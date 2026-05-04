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

  // Reads the live session directly from Supabase rather than relying on
  // React state, so refresh() works correctly when called immediately after
  // signUp (before the AuthContext listener has propagated `user`).
  const refresh = useCallback(async () => {
    const { data: { user: liveUser } } = await supabase.auth.getUser();
    if (!liveUser) {
      setProfile(null);
      return;
    }
    setLoading(true);
    const p = await getProfile(liveUser.id);
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

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
