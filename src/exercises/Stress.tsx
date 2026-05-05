import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import { STRESS_ITEMS, type StressItem } from './stressData';

interface Props {
  onBack: () => void;
}

interface Mistake {
  display: string;
  chosen: string;
  correct: string;
}

const VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);

function getStressIndex(correct: string): number {
  for (let i = 0; i < correct.length; i++) {
    const ch = correct[i];
    if (ch !== ch.toLowerCase() && ch === ch.toUpperCase()) return i;
  }
  return -1;
}

function withStressAt(plain: string, idx: number): string {
  return plain.slice(0, idx) + plain[idx].toUpperCase() + plain.slice(idx + 1);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'setup' | 'playing' | 'result' | 'drillEmpty' | 'drillLoading';
type Mode = 'game' | 'drill';

export default function Stress({ onBack }: Props) {
  const { user } = useAuth();
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('game');
  const [items, setItems] = useState<StressItem[]>([]);
  const [index, setIndex] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [shaking, setShaking] = useState(false);
  const [cardBg, setCardBg] = useState('rgba(255,255,255,0.85)');
  const [, setRenderKey] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const savedRef = useRef(false);
  const controls = useAnimation();

  const resultLabel = useMemo(
    () => pickResultLabel(finalTotal > 0 ? finalCorrect / finalTotal : 0),
    [finalCorrect, finalTotal],
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [index, phase, controls]);

  function startGame() {
    const selected = shuffle(STRESS_ITEMS).slice(0, Math.min(count, STRESS_ITEMS.length));
    setItems(selected);
    setMode('game');
    resetPlayState();
    setPhase('playing');
  }

  async function startDrill() {
    if (!user) return;
    setPhase('drillLoading');
    const { data } = await supabase
      .from('exercise_results')
      .select('details')
      .eq('exercise_name', 'stress')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const map = new Map<string, StressItem>();
    if (data) {
      for (const row of data) {
        const ms = (row.details as { mistakes?: unknown })?.mistakes;
        if (!Array.isArray(ms)) continue;
        for (const m of ms as { display?: string; correct?: string }[]) {
          if (!m.display || !m.correct) continue;
          if (!map.has(m.display)) {
            map.set(m.display, { plain: m.display, correct: m.correct, wrong: '' });
          }
        }
      }
    }
    const list = shuffle(Array.from(map.values()));
    if (list.length === 0) {
      setPhase('drillEmpty');
      return;
    }
    setItems(list);
    setMode('drill');
    resetPlayState();
    setPhase('playing');
  }

  function resetPlayState() {
    setIndex(0);
    setChosenIdx(null);
    setRevealed(false);
    setLocked(false);
    setMistakes([]);
    setShaking(false);
    setCardBg('rgba(255,255,255,0.85)');
    savedRef.current = false;
    setRenderKey((k) => k + 1);
  }

  async function handleVowelClick(idx: number) {
    if (locked || phase !== 'playing') return;
    const current = items[index];
    const correctIdx = getStressIndex(current.correct);
    const isRight = idx === correctIdx;

    setLocked(true);
    setChosenIdx(idx);

    if (isRight) {
      setCardBg('rgba(134, 239, 172, 0.55)');
      await controls.start({
        x: 380,
        opacity: 0,
        scale: 0.88,
        transition: { duration: 0.38, ease: 'easeIn' },
      });
      advance(index + 1, mistakes);
    } else {
      setCardBg('rgba(252, 165, 165, 0.55)');
      setShaking(true);
      await new Promise<void>((r) => setTimeout(r, 520));
      setShaking(false);
      setRevealed(true);
      setCardBg('rgba(134, 239, 172, 0.45)');
      const newMistakes = [
        ...mistakes,
        {
          display: current.plain,
          chosen: withStressAt(current.plain, idx),
          correct: current.correct,
        },
      ];
      setMistakes(newMistakes);
      await new Promise<void>((r) => setTimeout(r, 1600));
      await controls.start({
        y: 70,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      });
      advance(index + 1, newMistakes);
    }
  }

  function advance(nextIndex: number, currentMistakes: Mistake[]) {
    const total = items.length;
    if (nextIndex >= total) {
      const correct = total - currentMistakes.length;
      if (mode === 'game' && !savedRef.current) {
        savedRef.current = true;
        const score = Math.round((correct / total) * 100);
        saveResult(
          'stress',
          score,
          {
            correct,
            total,
            errors: currentMistakes.length,
            mistakes: currentMistakes,
          },
          correct * 10,
        );
      }
      setFinalCorrect(correct);
      setFinalTotal(total);
      setPhase('result');
      return;
    }
    setIndex(nextIndex);
    setChosenIdx(null);
    setRevealed(false);
    setCardBg('rgba(255,255,255,0.85)');
    controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    setRenderKey((k) => k + 1);
    setLocked(false);
  }

  /* ─── Drill loading / empty ─── */
  if (phase === 'drillLoading') {
    return <div className="flex items-center justify-center py-20 text-gray-500">Загрузка…</div>;
  }
  if (phase === 'drillEmpty') {
    return (
      <div className="flex flex-col items-center gap-5 py-16 animate-fade-in max-w-sm mx-auto text-center px-4">
        <div className="text-6xl">🎉</div>
        <p className="text-xl font-semibold text-gray-700">Нет ошибок для работы!</p>
        <p className="text-gray-500 text-sm">
          Пройдите упражнение, чтобы здесь появились слова для отработки.
        </p>
        <button
          onClick={() => setPhase('setup')}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
        >
          ← Назад
        </button>
      </div>
    );
  }

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-3 md:py-6 animate-fade-in w-full mx-auto px-2 max-w-sm md:max-w-xl">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">🔊</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Ударение</h1>
          <p className="text-gray-500 md:text-lg">Кликните на ударную гласную</p>
        </div>

        <div className="glass rounded-2xl w-full shadow-sm flex flex-col p-6 md:p-10 gap-6 md:gap-8">
          <div>
            <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4 text-center">
              Количество слов
            </p>
            <div className="flex gap-2 md:gap-3 justify-center">
              {[10, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 md:flex-none md:min-w-[96px] py-3 md:py-4 px-5 md:px-7 rounded-xl md:rounded-2xl text-base md:text-xl font-semibold transition-all duration-200 active:scale-95 ${
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

          <button
            onClick={startGame}
            className="w-full py-3.5 md:py-5 rounded-xl md:rounded-2xl text-base md:text-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Начать
          </button>
        </div>

        <MistakesHistory exerciseName="stress" />

        <button
          type="button"
          onClick={startDrill}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>✍️</span>
          <span>Работа над ошибками</span>
        </button>

        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1"
        >
          ← На главную
        </button>
      </div>
    );
  }

  /* ─── Result ─── */
  if (phase === 'result') {
    const { label, tone } = resultLabel;
    const scoreColor = toneToColor(tone);

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto px-3">
        <div className="glass rounded-2xl px-10 py-7 text-center shadow-sm w-full max-w-sm">
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>
            {finalCorrect} / {finalTotal}
          </div>
          <p className="text-gray-500 text-xl">
            {mode === 'drill' ? 'Работа над ошибками' : label}
          </p>
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-500 break-words">{m.display}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through break-all">
                      <StressedWord word={m.chosen} />
                    </span>
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg break-all">
                      <StressedWord word={m.correct} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={mode === 'drill' ? startDrill : startGame}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  /* ─── Playing ─── */
  const current = items[index];
  const correctIdx = getStressIndex(current.correct);
  const progressPct = (index / items.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in max-w-md md:max-w-3xl mx-auto w-full px-3">
      <div className="w-full">
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
        className={`w-full rounded-2xl px-4 py-10 md:py-12 shadow-md border border-white/60 flex flex-col items-center gap-4 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Выберите ударную гласную
        </div>

        <div
          className={`${
            current.plain.length > 11 ? 'text-3xl' : current.plain.length > 9 ? 'text-4xl' : 'text-5xl'
          } md:text-6xl font-bold text-gray-800 leading-tight tracking-wide select-none whitespace-nowrap`}
        >
          {[...current.plain].map((ch, i) => {
            const isVowel = VOWELS.has(ch.toLowerCase());
            if (!isVowel) {
              return (
                <span key={i} className="inline-block">
                  {ch}
                </span>
              );
            }

            const isChosen = chosenIdx === i;
            const isCorrectVowel = i === correctIdx;
            const showCorrectReveal = revealed && isCorrectVowel && !isChosen;

            let cls =
              'inline-block transition-all duration-200 rounded-md px-0.5 cursor-pointer hover:text-indigo-600 hover:scale-110';
            let display = ch;

            if (isChosen) {
              display = ch.toUpperCase();
              cls = isCorrectVowel
                ? 'inline-block rounded-md px-0.5 text-emerald-600 font-extrabold scale-110'
                : 'inline-block rounded-md px-0.5 text-red-500 font-extrabold scale-110';
            } else if (showCorrectReveal) {
              display = ch.toUpperCase();
              cls = 'inline-block rounded-md px-0.5 text-emerald-600 font-extrabold animate-pulse';
            } else if (chosenIdx === null) {
              cls += ' border-b-4 border-indigo-300/60';
            } else {
              cls = 'inline-block rounded-md px-0.5 text-gray-400';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleVowelClick(i)}
                disabled={locked}
                className={cls}
                aria-label={`гласная ${ch}`}
              >
                {display}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="flex flex-col items-center gap-1 mt-1 animate-fade-in">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Правильно
            </span>
            <span className="text-xl font-bold text-emerald-600">
              <StressedWord word={current.correct} />
            </span>
          </div>
        )}
      </motion.div>

      <button
        onClick={() => {
          if (mode === 'drill') {
            setPhase('setup');
          } else {
            setPhase('setup');
          }
        }}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Выйти
      </button>
    </div>
  );
}

function StressedWord({ word }: { word: string }) {
  return (
    <span>
      {[...word].map((ch, i) => {
        const isUpper = ch !== ch.toLowerCase() && ch === ch.toUpperCase();
        return isUpper ? (
          <span key={i} className="font-extrabold underline decoration-2 underline-offset-2">
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        );
      })}
    </span>
  );
}
