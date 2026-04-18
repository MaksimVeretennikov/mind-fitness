import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  computeStreak,
  loadFromLS,
  saveToLS,
  loadFromDB,
  saveToDB,
  type StreakData,
  type StreakState,
} from '../lib/streak';

interface StreakContextValue {
  count: number;
  best: number;
  changed: StreakState['changed'];
  showWelcome: boolean;
  dismissWelcome: () => void;
}

const StreakContext = createContext<StreakContextValue | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [streakState, setStreakState] = useState<StreakState>({
    count: 0, best: 0, showWelcome: false, changed: 'same-day',
  });

  useEffect(() => {
    let mounted = true;

    /**
     * Core logic: load from the right backend (DB for authed users,
     * localStorage for anonymous), compute the new streak, persist, update UI.
     *
     * Migration: if the user just logged in and has no DB record yet,
     * we seed from localStorage so they don't lose their current streak.
     */
    async function resolveStreak(userId: string | null) {
      const now = new Date();
      let prev: StreakData;

      if (userId) {
        const dbData = await loadFromDB(userId);
        prev = dbData ?? loadFromLS(); // seed from LS if no DB record yet

        const { data: newData, state: newState } = computeStreak(prev, now);

        if (newState.changed !== 'same-day') {
          saveToDB(userId, newData);   // fire-and-forget
          saveToLS(newData);           // keep as local cache
        }

        if (mounted) setStreakState(newState);
      } else {
        prev = loadFromLS();

        const { data: newData, state: newState } = computeStreak(prev, now);

        if (newState.changed !== 'same-day') saveToLS(newData);
        if (mounted) setStreakState(newState);
      }
    }

    // Initial load: read current session once (avoids double-fire from subscription)
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveStreak(session?.user?.id ?? null);
    });

    // Re-resolve whenever the user signs in or out mid-session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          resolveStreak(session?.user?.id ?? null);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const dismissWelcome = useCallback(() => {
    setStreakState(s => ({ ...s, showWelcome: false }));
  }, []);

  return (
    <StreakContext.Provider value={{
      count:        streakState.count,
      best:         streakState.best,
      changed:      streakState.changed,
      showWelcome:  streakState.showWelcome,
      dismissWelcome,
    }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak(): StreakContextValue {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used inside StreakProvider');
  return ctx;
}
