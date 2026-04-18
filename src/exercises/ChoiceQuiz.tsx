import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';

export interface QuizItem {
  /** What is shown at the top of the card (the question prompt). */
  display: ReactNode;
  /** Plain-text correct answer (shown as the button label / mistake reveal). */
  correct: string;
  /** Plain-text wrong answer (shown as the other button label). */
  wrong: string;
  /** Optional rendering for left/right buttons (overrides plain text). */
  correctLabel?: ReactNode;
  wrongLabel?: ReactNode;
  /** Optional context hint shown under the prompt (e.g. (здания)). */
  hint?: string;
}

interface Mistake {
  display: string;
  correct: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  /** Pool of items the question is sampled from. */
  pool: QuizItem[];
  /** Stable id for saveResult. */
  resultKey: string;
  /** Title shown on the setup screen. */
  title: string;
  /** Big emoji on the setup screen. */
  emoji: string;
  /** Subtitle on the setup screen. */
  subtitle: string;
  /** Number of questions to play. */
  count: number;
  /** Extra setup controls (rendered above the start button). */
  setupExtras?: ReactNode;
  /** Allow word-count selector (default true). */
  showCountSelector?: boolean;
  onCountChange?: (n: number) => void;
  /** Called when user wants to leave (back to home). */
  onBack: () => void;
  /** Called whenever the user starts a new game (used by parent to reset wrappers). */
  onStart?: () => void;
  /** Optional plain-string display extractor for mistakes panel. */
  displayToString?: (display: ReactNode) => string;
}

type Phase = 'setup' | 'playing' | 'result';

export default function ChoiceQuiz({
  pool,
  resultKey,
  title,
  emoji,
  subtitle,
  count,
  setupExtras,
  showCountSelector = true,
  onCountChange,
  onBack,
  onStart,
  displayToString,
}: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [items, setItems] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  // Per-question randomized layout: which side hosts the correct answer.
  const [layout, setLayout] = useState<('correct' | 'wrong')[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [locked, setLocked] = useState(false);
  const [cardBg, setCardBg] = useState('rgba(255,255,255,0.85)');
  const [revealText, setRevealText] = useState('');
  const [shaking, setShaking] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const cardKey = useRef(0);
  const savedRef = useRef(false);
  const controls = useAnimation();

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [renderKey, phase]);

  function startGame() {
    const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
    setItems(selected);
    setLayout(selected.map(() => (Math.random() < 0.5 ? 'correct' : 'wrong')));
    setIndex(0);
    setMistakes([]);
    setLocked(false);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealText('');
    setShaking(false);
    savedRef.current = false;
    cardKey.current = 0;
    onStart?.();
    setPhase('playing');
    setRenderKey((k) => k + 1);
  }

  async function handleAnswer(chosen: 'correct' | 'wrong') {
    if (locked) return;
    setLocked(true);
    const current = items[index];
    const isCorrect = chosen === 'correct';

    if (isCorrect) {
      setCardBg('rgba(134, 239, 172, 0.55)');
      await controls.start({
        x: 380,
        opacity: 0,
        scale: 0.88,
        transition: { duration: 0.38, ease: 'easeIn' },
      });
      advanceTo(index + 1, mistakes);
    } else {
      const displayStr = displayToString
        ? displayToString(current.display)
        : typeof current.display === 'string'
        ? current.display
        : '';
      const newMistakes = [...mistakes, { display: displayStr, correct: current.correct }];
      setMistakes(newMistakes);
      setCardBg('rgba(252, 165, 165, 0.55)');
      setShaking(true);
      await new Promise<void>((r) => setTimeout(r, 520));
      setShaking(false);
      setRevealText(current.correct);
      setCardBg('rgba(134, 239, 172, 0.45)');
      await new Promise<void>((r) => setTimeout(r, 1500));
      await controls.start({
        y: 70,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      });
      advanceTo(index + 1, newMistakes);
    }
  }

  function advanceTo(nextIndex: number, currentMistakes: Mistake[]) {
    const correct = nextIndex - currentMistakes.length;
    const total = items.length;
    if (nextIndex >= total) {
      const score = Math.round((correct / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult(resultKey, score, { correct, total, errors: currentMistakes.length });
      }
      setFinalCorrect(correct);
      setFinalTotal(total);
      setPhase('result');
      return;
    }
    setIndex(nextIndex);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealText('');
    controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    cardKey.current += 1;
    setRenderKey((k) => k + 1);
    setLocked(false);
  }

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
        <div className="glass rounded-3xl px-10 py-7 text-center shadow-sm">
          <div className="text-5xl mb-4 animate-float">{emoji}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-500 max-w-md mx-auto">{subtitle}</p>
        </div>

        <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-sm flex flex-col gap-6">
          {setupExtras}

          {showCountSelector && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
                Количество слов
              </p>
              <div className="flex gap-2 justify-center">
                {[10, 20, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => onCountChange?.(n)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      count === n
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                        : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  /* ─── Result ─── */
  if (phase === 'result') {
    const pct = finalTotal > 0 ? finalCorrect / finalTotal : 0;
    const scoreColor =
      pct >= 0.8 ? 'text-emerald-600' : pct >= 0.5 ? 'text-amber-500' : 'text-red-500';
    const label =
      pct >= 0.8 ? '🎉 Отлично!' : pct >= 0.5 ? '👍 Неплохо!' : '📚 Нужно потренироваться';

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto">
        <div className="text-center">
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>
            {finalCorrect} / {finalTotal}
          </div>
          <p className="text-gray-500 text-xl">{label}</p>
        </div>

        {mistakes.length > 0 && (
          <div className="glass rounded-2xl p-6 w-full shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
              Ошибки ({mistakes.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {mistakes.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-500">{m.display}</span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {m.correct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={startGame}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  /* ─── Playing ─── */
  const current = items[index];
  const progressPct = (index / items.length) * 100;
  const leftIs = layout[index];
  const rightIs = leftIs === 'correct' ? 'wrong' : 'correct';
  const labelFor = (side: 'correct' | 'wrong') =>
    side === 'correct'
      ? current.correctLabel ?? current.correct
      : current.wrongLabel ?? current.wrong;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
          <span>
            {index + 1} / {items.length}
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-white/40">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <motion.div
        animate={controls}
        className={`w-full max-w-md rounded-2xl p-10 shadow-md border border-white/60 flex flex-col items-center gap-3 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-4xl font-bold text-gray-800 text-center leading-tight">
          {current.display}
        </div>
        {current.hint && (
          <div className="text-sm text-gray-500 italic">{current.hint}</div>
        )}
        {revealText && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Правильно
            </span>
            <span className="text-xl font-bold text-emerald-600">{revealText}</span>
          </div>
        )}
      </motion.div>

      <div className="flex gap-5 w-full max-w-2xl px-2">
        <button
          onClick={() => handleAnswer(leftIs)}
          disabled={locked}
          className="flex-1 min-h-[96px] py-6 px-5 rounded-3xl text-xl font-bold text-white bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg hover:shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed leading-snug"
        >
          {labelFor(leftIs)}
        </button>
        <button
          onClick={() => handleAnswer(rightIs)}
          disabled={locked}
          className="flex-1 min-h-[96px] py-6 px-5 rounded-3xl text-xl font-bold text-white bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg hover:shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed leading-snug"
        >
          {labelFor(rightIs)}
        </button>
      </div>
    </div>
  );
}
