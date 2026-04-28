import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import ErrorDrill from './ErrorDrill';

export interface TextItem {
  display: string;
  answer: string;
}

interface Mistake {
  display: string;
  chosen: string;
  correct: string;
}

interface Props {
  items: TextItem[];
  resultKey: string;
  title: string;
  emoji: string;
  subtitle: string;
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

export default function TextInputExercise({ items, resultKey, title, emoji, subtitle, onBack }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [showDrill, setShowDrill] = useState(false);
  const [count, setCount] = useState(10);
  const [words, setWords] = useState<TextItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [locked, setLocked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [cardBg, setCardBg] = useState('rgba(255,255,255,0.85)');
  const [revealCorrect, setRevealCorrect] = useState('');
  const [revealWrong, setRevealWrong] = useState('');
  const [shaking, setShaking] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const savedRef = useRef(false);
  const controls = useAnimation();
  const [renderKey, setRenderKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const resultLabel = useMemo(
    () => pickResultLabel(finalTotal > 0 ? finalCorrect / finalTotal : 0),
    [finalCorrect, finalTotal],
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [renderKey, phase]);

  function startGame() {
    const selected = shuffle(items).slice(0, count);
    setWords(selected);
    setIndex(0);
    setMistakes([]);
    setLocked(false);
    setInputValue('');
    setCardBg('rgba(255,255,255,0.85)');
    setRevealCorrect('');
    setRevealWrong('');
    setShaking(false);
    savedRef.current = false;
    setPhase('playing');
    setRenderKey(k => k + 1);
  }

  async function handleSubmit() {
    if (locked || !inputValue.trim()) return;
    setLocked(true);

    const current = words[index];
    const userAnswer = inputValue.trim();
    const isCorrect = userAnswer.toLowerCase() === current.answer.toLowerCase();

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
      const newMistakes: Mistake[] = [
        ...mistakes,
        { display: current.display, chosen: userAnswer, correct: current.answer },
      ];
      setMistakes(newMistakes);

      setCardBg('rgba(252, 165, 165, 0.55)');
      setRevealWrong(userAnswer);
      setShaking(true);
      await new Promise<void>(r => setTimeout(r, 520));
      setShaking(false);

      setRevealCorrect(current.answer);
      setCardBg('rgba(134, 239, 172, 0.45)');
      await new Promise<void>(r => setTimeout(r, 1500));

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
    const total = words.length;

    if (nextIndex >= total) {
      const score = Math.round((correct / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult(
          resultKey,
          score,
          { correct, total, errors: currentMistakes.length, mistakes: currentMistakes },
          correct * 10,
        );
      }
      setFinalCorrect(correct);
      setFinalTotal(total);
      setPhase('result');
      return;
    }

    setIndex(nextIndex);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealCorrect('');
    setRevealWrong('');
    setInputValue('');
    controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    setRenderKey(k => k + 1);
    setLocked(false);
  }

  if (showDrill) {
    return <ErrorDrill exerciseName={resultKey} mode="text" onBack={() => setShowDrill(false)} />;
  }

  /* ─── Setup ──────────────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">{emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-500 md:text-lg">{subtitle}</p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-10 w-full shadow-sm flex flex-col gap-6 md:gap-8">
          <div>
            <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4 text-center">
              Количество слов
            </p>
            <div className="flex gap-2 md:gap-3 justify-center">
              {[10, 20, 30].map(n => (
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

        <MistakesHistory exerciseName={resultKey} />

        <button
          type="button"
          onClick={() => setShowDrill(true)}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>✍️</span>
          <span>Работа над ошибками</span>
        </button>
      </div>
    );
  }

  /* ─── Result ─────────────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const { label, tone } = resultLabel;
    const scoreColor = toneToColor(tone);

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto">
        <div className="glass rounded-2xl px-10 py-7 text-center shadow-sm w-full max-w-sm">
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
                  className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-400 shrink-0 text-xs leading-6">{m.display}</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through">
                      {m.chosen}
                    </span>
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {m.correct}
                    </span>
                  </div>
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

        {mistakes.length > 0 && (
          <button
            onClick={() => setShowDrill(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/80 text-gray-700 text-sm font-medium transition-all active:scale-95 border border-white/60"
          >
            <span>✍️</span>
            <span>Работа над ошибками</span>
          </button>
        )}
      </div>
    );
  }

  /* ─── Playing ────────────────────────────────────────────────────────────── */
  const currentWord = words[index];
  const progressPct = (index / words.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
          <span>{index + 1} / {words.length}</span>
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
        className={`w-full max-w-md rounded-2xl p-8 shadow-md border border-white/60 flex flex-col items-center gap-4 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <p className="text-2xl md:text-3xl font-bold text-gray-800 text-center leading-snug">
          {currentWord.display}
        </p>

        {!locked && (
          <div className="flex gap-2 w-full mt-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Введите слово..."
              className="flex-1 px-4 py-3 rounded-xl border border-white/60 bg-white/70 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white/90 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="px-5 py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓
            </button>
          </div>
        )}

        {(revealWrong || revealCorrect) && (
          <div className="flex flex-col items-center gap-2 mt-1">
            {revealWrong && (
              <span className="text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-lg line-through text-lg">
                {revealWrong}
              </span>
            )}
            {revealCorrect && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Правильно
                </span>
                <span className="text-xl font-bold text-emerald-600">{revealCorrect}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
