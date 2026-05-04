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
import VerbSuffixes from './exercises/VerbSuffixes';
import RootSpelling from './exercises/RootSpelling';
import SuffixSpelling from './exercises/SuffixSpelling';
import IntroWords from './exercises/IntroWords';
import NeNi from './exercises/NeNi';
import DogBreeds from './exercises/DogBreeds';
import SmartCount from './exercises/SmartCount';
import MirrorDrawing from './exercises/MirrorDrawing';
import MemoryCipher from './exercises/MemoryCipher';
import LetterStrikeout from './exercises/LetterStrikeout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StreakProvider } from './contexts/StreakContext';
import { GroupProvider } from './contexts/GroupContext';
import { AccessProvider, useAccess } from './contexts/AccessContext';
import UserBadge from './components/UserBadge';
import StreakBadge from './components/StreakBadge';
import DailyWelcome from './components/DailyWelcome';
import AuthScreen from './components/AuthScreen';
import JoinGroupScreen from './components/JoinGroupScreen';
import LegalPage from './components/LegalPage';
import AdminPanel from './components/AdminPanel';
import ResetPasswordModal from './components/ResetPasswordModal';
import HistoryPanel from './components/HistoryPanel';
import GroupModal from './components/GroupModal';
import TeacherDashboard from './components/TeacherDashboard';
import GroupRanking from './components/GroupRanking';
import TrophyButton from './components/TrophyButton';
import DynamicBackground from './components/DynamicBackground';
import DevTimePanel from './components/DevTimePanel';
import type { DayIndex } from './weeklyPhotos';
import { useRoute } from './lib/router';

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
    case 'verb-suffixes': return <VerbSuffixes onBack={onBack} />;
    case 'root-spelling': return <RootSpelling onBack={onBack} />;
    case 'suffix-spelling': return <SuffixSpelling onBack={onBack} />;
    case 'intro-words': return <IntroWords onBack={onBack} />;
    case 'ne-ni': return <NeNi onBack={onBack} />;
    case 'dog-breeds': return <DogBreeds onBack={onBack} />;
    case 'smart-count': return <SmartCount />;
    case 'mirror-drawing': return <MirrorDrawing />;
    case 'memory-cipher': return <MemoryCipher />;
    case 'letter-strikeout': return <LetterStrikeout />;
  }
}

function MainApp() {
  const [current, setCurrent] = useState<ExerciseId | null>(null);
  return (
    <>
      <UserBadge />
      <div className="top-right-badges">
        <TrophyButton />
        <StreakBadge />
      </div>
      <ResetPasswordModal />
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
    </>
  );
}

function Gate() {
  const route = useRoute();
  const { user, loading: authLoading, resetPasswordMode } = useAuth();
  const { accessType, isAdmin, loading: accessLoading } = useAccess();

  // Public legal pages — accessible regardless of auth state.
  if (route === '/privacy') return <LegalPage doc="privacy" />;
  if (route === '/terms') return <LegalPage doc="terms" />;

  if (authLoading) {
    return <div className="auth-screen"><div className="auth-loading">Загрузка…</div></div>;
  }

  // Password recovery still flows through the modal (handled inside MainApp).
  if (resetPasswordMode && user) {
    return <MainApp />;
  }

  if (!user) return <AuthScreen />;

  // Admin route is only visible to the admin.
  if (route === '/admin') {
    if (isAdmin) return <AdminPanel />;
    // Non-admins fall through to normal gating.
  }

  if (accessLoading && !accessType) {
    return <div className="auth-screen"><div className="auth-loading">Загрузка профиля…</div></div>;
  }

  // New users without a role yet → must enter a code.
  if (accessType === 'pending') return <JoinGroupScreen />;

  return <MainApp />;
}

export default function App() {
  const [devHour, setDevHour] = useState<number | undefined>(undefined);
  const [devDay, setDevDay] = useState<DayIndex | undefined>(undefined);

  return (
    <>
      <AuthProvider>
        <AccessProvider>
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
              <Gate />
            </StreakProvider>
          </GroupProvider>
        </AccessProvider>
      </AuthProvider>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
