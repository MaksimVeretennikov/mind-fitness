import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
import Prefixes from './exercises/Prefixes';
import SpellingNN from './exercises/SpellingNN';
import WordForms from './exercises/WordForms';
import Stress from './exercises/Stress';
import Abbreviations from './exercises/Abbreviations';
import GeographyMap from './exercises/GeographyMap';
import GeographyCapitals from './exercises/GeographyCapitals';
import Pleonasms from './exercises/Pleonasms';
import { AuthProvider } from './contexts/AuthContext';
import { StreakProvider } from './contexts/StreakContext';
import { GroupProvider } from './contexts/GroupContext';
import UserBadge from './components/UserBadge';
import StreakBadge from './components/StreakBadge';
import DailyWelcome from './components/DailyWelcome';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import GroupModal from './components/GroupModal';
import TeacherDashboard from './components/TeacherDashboard';
import GroupRanking from './components/GroupRanking';
import TrophyButton from './components/TrophyButton';
import DynamicBackground from './components/DynamicBackground';
import DevTimePanel from './components/DevTimePanel';
import type { DayIndex } from './weeklyPhotos';

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
    case 'prefixes': return <Prefixes onBack={onBack} />;
    case 'spelling-nn': return <SpellingNN onBack={onBack} />;
    case 'word-forms': return <WordForms onBack={onBack} />;
    case 'stress': return <Stress onBack={onBack} />;
    case 'abbreviations': return <Abbreviations onBack={onBack} />;
    case 'geography-map': return <GeographyMap onBack={onBack} />;
    case 'geography-capitals': return <GeographyCapitals onBack={onBack} />;
    case 'pleonasms': return <Pleonasms onBack={onBack} />;
  }
}

export default function App() {
  const [current, setCurrent] = useState<ExerciseId | null>(null);
  const [devHour, setDevHour] = useState<number | undefined>(undefined);
  const [devDay, setDevDay] = useState<DayIndex | undefined>(undefined);

  return (
    <>
    <AuthProvider>
      <GroupProvider>
      <StreakProvider>
        <DynamicBackground hourOverride={devHour} dayOverride={devDay} />
        {import.meta.env.DEV && (
          <DevTimePanel
            currentHour={devHour}
            currentDay={devDay}
            onHourChange={setDevHour}
            onDayChange={setDevDay}
          />
        )}
        <UserBadge />
        <div className="top-right-badges">
          <TrophyButton />
          <StreakBadge />
        </div>
        <AuthModal />
        <HistoryPanel />
        <GroupModal />
        <TeacherDashboard />
        <GroupRanking />
        <DailyWelcome />

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
      </StreakProvider>
      </GroupProvider>
    </AuthProvider>
    <Analytics />
    <SpeedInsights />
    </>
  );
}
