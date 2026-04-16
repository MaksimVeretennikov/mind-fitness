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
import Adverbs from './exercises/Adverbs';
import { AuthProvider } from './contexts/AuthContext';
import UserBadge from './components/UserBadge';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import DynamicBackground from './components/DynamicBackground';

function ExerciseComponent({ id, onBack }: { id: ExerciseId; onBack: () => void }) {
  switch (id) {
    case 'munsterberg': return <Munsterberg />;
    case 'philwords': return <Philwords />;
    case 'schulte': return <Schulte />;
    case 'sequence': return <Sequence />;
    case 'pairs': return <Pairs />;
    case 'balls': return <Balls />;
    case 'reaction': return <Reaction />;
    case 'adverbs': return <Adverbs onBack={onBack} />;
  }
}

export default function App() {
  const [current, setCurrent] = useState<ExerciseId | null>(null);

  return (
    <AuthProvider>
      <DynamicBackground />
      <UserBadge />
      <AuthModal />
      <HistoryPanel />

      <main>
        {current ? (
          <ExerciseShell id={current} onBack={() => setCurrent(null)}>
            <ExerciseComponent id={current} onBack={() => setCurrent(null)} />
          </ExerciseShell>
        ) : (
          <HomeScreen onSelect={setCurrent} />
        )}
      </main>

      <footer className="app-footer">
        <div>Created by Maksim Veretennikov</div>
        <div>Copyright &copy; 2026. All rights reserved.</div>
      </footer>
    </AuthProvider>
  );
}
