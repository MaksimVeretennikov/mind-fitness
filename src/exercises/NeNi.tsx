import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import ErrorDrill from './ErrorDrill';
import {
  NE_NI_WORDS,
  NE_NI_SENTENCES,
  correctMarker,
  wrongMarker,
  type NeNiItem,
  type NeNiType,
} from '../data/neNiData';

type Phase = 'setup' | 'playing' | 'result';

interface Mistake {
  display: string;
  chosen: string;
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

function DisplayText({ item }: { item: NeNiItem }) {
  return <>{item.display}</>;
}

interface Props {
  onBack: () => void;
}

export default function NeNi({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [showDrill, setShowDrill] = useState(false);
  const [count, setCount] = useState<10 | 20 | 30>(10);
  const [mode, setMode] = useState<NeNiType>('word');
  const [items, setItems] = useState<NeNiItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [locked, setLocked] = useState(false);
  const [cardBg, setCardBg] = useState('rgba(255,255,255,0.85)');
  const [revealText, setRevealText] = useState('');
  const [shaking, setShaking] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const cardKey = useRef(0);
  const savedRef = useRef(false);
  const controls = useAnimation();
  const [renderKey, setRenderKey] = useState(0);

  const resultLabel = useMemo(
    () => pickResultLabel(finalTotal > 0 ? finalCorrect / finalTotal : 0),
    [finalCorrect, finalTotal],
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [renderKey, phase]);

  function startGame() {
    const pool = mode === 'word' ? NE_NI_WORDS : NE_NI_SENTENCES;
    // If requested count exceeds pool size, take all and reshuffle.
    const chosen = shuffle(pool).slice(0, Math.min(count, pool.length));
    setItems(chosen);
    setIndex(0);
    setMistakes([]);
    setLocked(false);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealText('');
    setShaking(false);
    savedRef.current = false;
    cardKey.current = 0;
    setPhase('playing');
    setRenderKey(k => k + 1);
  }

  async function handleAnswer(answer: 'слитно' | 'раздельно') {
    if (locked) return;
    setLocked(true);

    const current = items[index];
    const isCorrect = answer === current.answer;

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
        {
          display: current.display,
          chosen: wrongMarker(current),
          correct: correctMarker(current),
        },
      ];
      setMistakes(newMistakes);

      setCardBg('rgba(252, 165, 165, 0.55)');
      setShaking(true);
      await new Promise<void>(r => setTimeout(r, 520));
      setShaking(false);

      setRevealText(correctMarker(current));
      setCardBg('rgba(134, 239, 172, 0.45)');
      await new Promise<void>(r => setTimeout(r, 1700));

      await controls.start({
        y: 70,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      });
      advanceTo(index + 1, newMistakes);
    }
  }

  function advanceTo(nextIndex: number, currentMistakes: Mistake[]) {
    const total = items.length;
    const correct = nextIndex - currentMistakes.length;

    if (nextIndex >= total) {
      const score = Math.round((correct / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('ne-ni', score, {
          correct,
          total,
          errors: currentMistakes.length,
          mode,
          mistakes: currentMistakes,
        }, correct * 10);
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
    setRenderKey(k => k + 1);
    setLocked(false);
  }

  /* ─── Drill ─── */
  if (showDrill) {
    return <ErrorDrill exerciseName="ne-ni" mode="text" onBack={() => setShowDrill(false)} />;
  }

  /* ─── Setup Screen ──────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">🪶</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Правописание НЕ / НИ</h1>
          <p className="text-gray-500 md:text-lg">
            Слитно или раздельно? Выберите режим и количество
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-10 w-full shadow-sm flex flex-col gap-6 md:gap-8">
          <div>
            <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4 text-center">
              Что тренируем
            </p>
            <div className="flex gap-2 md:gap-3 justify-center">
              {([
                { id: 'word' as const, label: 'Слова' },
                { id: 'sentence' as const, label: 'Предложения' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  className={`flex-1 py-3 md:py-4 px-5 md:px-7 rounded-xl md:rounded-2xl text-base md:text-xl font-semibold transition-all duration-200 active:scale-95 ${
                    mode === opt.id
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4 text-center">
              Количество
            </p>
            <div className="flex gap-2 md:gap-3 justify-center">
              {([10, 20, 30] as const).map(n => (
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

        <MistakesHistory exerciseName="ne-ni" />

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

  /* ─── Result Screen ─────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const { label, tone } = resultLabel;
    const scoreColor = toneToColor(tone);

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-2xl mx-auto w-full px-3">
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
                  className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0 flex-wrap"
                >
                  <span className="text-gray-500 flex-1 min-w-0 break-words leading-snug">{m.display}</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
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
            onClick={() => setPhase('setup')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            Настройки
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

  /* ─── Playing Screen ────────────────────────────────────────────────────── */
  const currentItem = items[index];
  const progressPct = (index / items.length) * 100;
  const isSentence = currentItem.type === 'sentence';

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in w-full max-w-2xl mx-auto px-3">
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

      <motion.div
        animate={controls}
        className={`w-full rounded-2xl ${isSentence ? 'p-7 md:p-9' : 'p-10'} shadow-md border border-white/60 flex flex-col items-center gap-4 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <p
          className={`font-bold text-gray-800 text-center ${
            isSentence ? 'text-xl md:text-2xl leading-relaxed' : 'text-3xl md:text-4xl leading-tight'
          }`}
        >
          <DisplayText item={currentItem} />
        </p>

        {revealText && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Правильно
            </span>
            <span className="text-xl font-bold text-emerald-600">{revealText}</span>
          </div>
        )}
      </motion.div>

      <div className="flex gap-4 w-full">
        <button
          onClick={() => handleAnswer('слитно')}
          disabled={locked}
          className="flex-1 py-5 md:py-7 rounded-2xl text-base md:text-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          СЛИТНО
        </button>
        <button
          onClick={() => handleAnswer('раздельно')}
          disabled={locked}
          className="flex-1 py-5 md:py-7 rounded-2xl text-base md:text-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          РАЗДЕЛЬНО
        </button>
      </div>
    </div>
  );
}
