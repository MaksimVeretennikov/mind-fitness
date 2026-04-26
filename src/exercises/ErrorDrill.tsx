import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DrillItem {
  display: string;
  correct: string;
  wrong: string; // last incorrect answer the user chose
}

interface Props {
  exerciseName: string;
  /** 'text' — user types the answer; 'choice' — user clicks a button (for stress marks) */
  mode: 'text' | 'choice';
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Renders a word, making uppercase letters (stress marks) bold */
function StressWord({ word }: { word: string }) {
  return (
    <span>
      {[...word].map((ch, i) => {
        const isUpper = ch !== ch.toLowerCase() && ch === ch.toUpperCase();
        return isUpper
          ? <span key={i} className="font-extrabold">{ch}</span>
          : <span key={i}>{ch}</span>;
      })}
    </span>
  );
}

type Phase = 'loading' | 'empty' | 'quiz' | 'result';
type Feedback = 'correct' | 'wrong' | null;

export default function ErrorDrill({ exerciseName, mode, onBack }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<DrillItem[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [choiceLayout, setChoiceLayout] = useState<[string, string]>(['', '']);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('exercise_results')
      .select('details')
      .eq('exercise_name', exerciseName)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) { setPhase('empty'); return; }
        const map = new Map<string, DrillItem>();
        for (const row of data) {
          const mistakes = (row.details as { mistakes?: unknown })?.mistakes;
          if (!Array.isArray(mistakes)) continue;
          for (const m of mistakes as { display?: string; correct?: string; chosen?: string }[]) {
            if (!m.display || !m.correct || !m.chosen) continue;
            if (!map.has(m.display)) {
              map.set(m.display, { display: m.display, correct: m.correct, wrong: m.chosen });
            }
          }
        }
        const list = shuffle(Array.from(map.values()));
        if (list.length === 0) { setPhase('empty'); return; }
        setItems(list);
        setChoiceLayout(randomizeChoice(list[0]));
        setPhase('quiz');
      });
  }, [user, exerciseName]);

  function randomizeChoice(item: DrillItem): [string, string] {
    return Math.random() < 0.5 ? [item.correct, item.wrong] : [item.wrong, item.correct];
  }

  function advance(wasCorrect: boolean) {
    if (wasCorrect) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      setFeedback(null);
      const next = index + 1;
      if (next >= items.length) {
        setPhase('result');
      } else {
        setIndex(next);
        setChoiceLayout(randomizeChoice(items[next]));
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, 900);
  }

  function handleText() {
    if (feedback) return;
    const item = items[index];
    const isCorrect = input.trim().toLowerCase() === item.correct.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    advance(isCorrect);
  }

  function handleChoice(chosen: string) {
    if (feedback) return;
    const isCorrect = chosen === items[index].correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    advance(isCorrect);
  }

  function restart() {
    const reshuffled = shuffle(items);
    setItems(reshuffled);
    setIndex(0);
    setCorrectCount(0);
    setInput('');
    setFeedback(null);
    setChoiceLayout(randomizeChoice(reshuffled[0]));
    setPhase('quiz');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  /* ─── Loading ─── */
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">Загрузка…</div>
    );
  }

  /* ─── Empty ─── */
  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center gap-5 py-16 animate-fade-in max-w-sm mx-auto text-center px-4">
        <div className="text-6xl">🎉</div>
        <p className="text-xl font-semibold text-gray-700">Нет ошибок для работы!</p>
        <p className="text-gray-500 text-sm">Пройдите упражнение, чтобы здесь появились слова для отработки.</p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
        >
          ← Назад
        </button>
      </div>
    );
  }

  /* ─── Result ─── */
  if (phase === 'result') {
    const ratio = correctCount / items.length;
    const color = ratio >= 0.8 ? 'text-emerald-600' : ratio >= 0.5 ? 'text-amber-500' : 'text-red-500';
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto px-4">
        <div className="glass rounded-2xl px-10 py-7 text-center shadow-sm w-full max-w-sm">
          <div className={`text-7xl font-bold mb-2 ${color}`}>
            {correctCount} / {items.length}
          </div>
          <p className="text-gray-500 text-xl">Работа над ошибками</p>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={restart}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Повторить
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  /* ─── Quiz ─── */
  const item = items[index];
  const progressPct = (index / items.length) * 100;

  const cardBg =
    feedback === 'correct'
      ? 'rgba(134, 239, 172, 0.55)'
      : feedback === 'wrong'
      ? 'rgba(252, 165, 165, 0.55)'
      : 'rgba(255,255,255,0.85)';

  return (
    <div className="flex flex-col items-center gap-5 py-6 animate-fade-in max-w-md mx-auto w-full px-3">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
          <span>{index + 1} / {items.length}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-white/40">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full rounded-2xl p-8 shadow-md border border-white/60 backdrop-blur-md transition-colors duration-200 text-center"
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Напишите правильно
        </div>
        <div className="text-3xl font-bold text-gray-800 leading-tight mb-1">
          {item.display}
        </div>
        {feedback === 'wrong' && (
          <div className="mt-3 flex flex-col items-center gap-1 animate-fade-in">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Правильно</span>
            <span className="text-lg font-bold text-emerald-600">
              {mode === 'choice' ? <StressWord word={item.correct} /> : item.correct}
            </span>
          </div>
        )}
        {feedback === 'correct' && (
          <div className="mt-3 text-emerald-600 font-bold text-lg animate-fade-in">✓ Верно!</div>
        )}
      </div>

      {/* Input (text mode) */}
      {mode === 'text' && (
        <div className="w-full flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !feedback && handleText()}
            placeholder="Введите ответ…"
            autoFocus
            disabled={!!feedback}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-base bg-white/80 disabled:opacity-60 transition-colors"
          />
          <button
            onClick={handleText}
            disabled={!!feedback || !input.trim()}
            className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      )}

      {/* Buttons (choice mode) */}
      {mode === 'choice' && (
        <div className="w-full flex gap-4">
          {choiceLayout.map((opt) => {
            const isCorrect = opt === item.correct;
            const btnStyle =
              feedback === null
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white hover:opacity-90'
                : isCorrect
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400'
                : 'bg-red-100 text-red-400 opacity-60';
            return (
              <button
                key={opt}
                onClick={() => handleChoice(opt)}
                disabled={!!feedback}
                className={`flex-1 min-h-[72px] py-4 px-3 rounded-2xl text-xl font-bold shadow-md transition-all active:scale-95 disabled:cursor-not-allowed ${btnStyle}`}
              >
                <StressWord word={opt} />
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1"
      >
        ← Выйти
      </button>
    </div>
  );
}
