import { useState, useRef, useMemo } from 'react';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import { PLEONASM_ITEMS, isRedundant, correctLabel, type PleonasmItem } from './pleonasmsData';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Mistake {
  display: string;
  chosen: string;
  correct: string;
}

type Phase = 'setup' | 'playing' | 'done';

interface Props {
  onBack: () => void;
}

export default function Pleonasms({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [items, setItems] = useState<PleonasmItem[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const savedRef = useRef(false);

  const resultLabel = useMemo(
    () => pickResultLabel(finalTotal > 0 ? finalCorrect / finalTotal : 0),
    [finalCorrect, finalTotal],
  );

  function startGame() {
    const selected = shuffle(PLEONASM_ITEMS).slice(0, Math.min(count, PLEONASM_ITEMS.length));
    setItems(selected);
    setIndex(0);
    setCorrectCount(0);
    setMistakes([]);
    setClickedWord(null);
    savedRef.current = false;
    setPhase('playing');
  }

  function handleWordClick(word: string) {
    if (clickedWord !== null) return;
    const current = items[index];
    const isCorrect = isRedundant(current, word);

    setClickedWord(word);

    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newMistakes = isCorrect
      ? mistakes
      : [...mistakes, { display: current.words.join(' '), chosen: word, correct: correctLabel(current) }];

    if (!isCorrect) setMistakes(newMistakes);

    setTimeout(() => {
      const nextIndex = index + 1;
      const total = items.length;

      if (nextIndex >= total) {
        const score = Math.round((newCorrect / total) * 100);
        if (!savedRef.current) {
          savedRef.current = true;
          saveResult(
            'pleonasms',
            score,
            { correct: newCorrect, total, errors: total - newCorrect, mistakes: newMistakes },
            newCorrect,
          );
        }
        setFinalCorrect(newCorrect);
        setFinalTotal(total);
        setPhase('done');
        return;
      }

      setCorrectCount(newCorrect);
      setIndex(nextIndex);
      setClickedWord(null);
    }, 900);
  }

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-6 md:gap-8 py-6 md:py-10 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">🔡</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Плеоназмы</h1>
          <p className="text-gray-500 md:text-lg">Нажмите на лишнее слово в словосочетании</p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-10 w-full shadow-sm flex flex-col gap-6 md:gap-8">
          <div>
            <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4 text-center">
              Количество заданий
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

        <MistakesHistory exerciseName="pleonasms" />
      </div>
    );
  }

  /* ─── Done ─── */
  if (phase === 'done') {
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
                  className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700">{m.display}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-red-500 line-through text-xs">{m.chosen}</span>
                    <span className="text-emerald-600 font-semibold">{m.correct}</span>
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
      </div>
    );
  }

  /* ─── Playing ─── */
  const current = items[index];
  const progressPct = (index / items.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in w-full">
      <div className="w-full max-w-2xl">
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

      <div className="glass rounded-2xl px-8 py-10 w-full max-w-2xl shadow-sm text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-10">
          Нажмите на лишнее слово
        </p>
        <p className="text-3xl md:text-4xl font-semibold leading-relaxed">
          {current.words.map((word, wi) => {
            let cls = 'transition-all duration-200 ';
            if (clickedWord === null) {
              cls += 'text-gray-800 cursor-pointer underline decoration-dotted decoration-gray-400 [@media(hover:hover)]:hover:text-indigo-600 [@media(hover:hover)]:hover:decoration-indigo-400';
            } else if (isRedundant(current, word)) {
              cls += 'text-emerald-600 font-bold no-underline cursor-default';
            } else if (word === clickedWord) {
              cls += 'text-red-500 line-through no-underline cursor-default';
            } else {
              cls += 'text-gray-400 no-underline cursor-default';
            }
            return (
              <span key={wi}>
                <button
                  onClick={() => handleWordClick(word)}
                  disabled={clickedWord !== null}
                  className={cls}
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                >
                  {word}
                </button>
                {wi < current.words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
