import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  showHistoryPanel: boolean;
  setShowHistoryPanel: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Неверный email или пароль';
  if (message.includes('User already registered') || message.includes('already been registered')) return 'Пользователь с таким email уже существует';
  if (message.includes('Email not confirmed')) return 'Подтвердите email перед входом';
  if (message.includes('Password should be at least')) return 'Пароль должен быть не менее 6 символов';
  if (message.includes('Unable to validate email address')) return 'Неверный формат email';
  if (message.includes('email_address_invalid')) return 'Неверный формат email';
  return 'Произошла ошибка. Попробуйте снова';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return translateError(error.message);
    setShowAuthModal(false);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: username?.trim() || null } },
    });
    if (error) return translateError(error.message);
    setShowAuthModal(false);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setShowHistoryPanel(false);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return translateError(error.message);
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      showAuthModal,
      setShowAuthModal,
      showHistoryPanel,
      setShowHistoryPanel,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
