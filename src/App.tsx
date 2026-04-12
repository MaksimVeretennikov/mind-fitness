import { useState } from 'react';
import type { ExerciseId } from './types';
import HomeScreen from './components/HomeScreen';
import ExerciseShell from './components/ExerciseShell';
import Munsterberg from './exercises/Munsterberg';
import Philwords from './exercises/Philwords';
import Schulte from './exercises/Schulte';
import Sequence from './exercises/Sequence';
import Pairs from './exercises/Pairs';
import Balls from './exercises/Balls';
import Reaction from './exercises/Reaction';
import { AuthProvider } from './contexts/AuthContext';
import UserBadge from './components/UserBadge';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';

function ExerciseComponent({ id }: { id: ExerciseId }) {
  switch (id) {
    case 'munsterberg': return <Munsterberg />;
    case 'philwords': return <Philwords />;
    case 'schulte': return <Schulte />;
    case 'sequence': return <Sequence />;
    case 'pairs': return <Pairs />;
    case 'balls': return <Balls />;
    case 'reaction': return <Reaction />;
  }
}

export default function App() {
  const [current, setCurrent] = useState<ExerciseId | null>(null);

  return (
    <AuthProvider>
      <UserBadge />
      <AuthModal />
      <HistoryPanel />

      {current ? (
        <ExerciseShell id={current} onBack={() => setCurrent(null)}>
          <ExerciseComponent id={current} />
        </ExerciseShell>
      ) : (
        <HomeScreen onSelect={setCurrent} />
      )}
    </AuthProvider>
  );
}
