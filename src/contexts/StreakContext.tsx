import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { resolveStreak, type StreakState } from '../lib/streak';

interface StreakContextValue {
  count: number;
  best: number;
  changed: StreakState['changed'];
  showWelcome: boolean;
  dismissWelcome: () => void;
}

const StreakContext = createContext<StreakContextValue | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StreakState>(() => ({
    count: 0, best: 0, showWelcome: false, changed: 'same-day',
  }));
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current) return;
    resolved.current = true;
    setState(resolveStreak());
  }, []);

  const dismissWelcome = useCallback(() => {
    setState(s => ({ ...s, showWelcome: false }));
  }, []);

  return (
    <StreakContext.Provider value={{
      count: state.count,
      best: state.best,
      changed: state.changed,
      showWelcome: state.showWelcome,
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
