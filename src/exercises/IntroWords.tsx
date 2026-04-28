import { useState, useMemo, useRef } from 'react';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import ErrorDrill from './ErrorDrill';
import { INTRO_WORDS, type IntroWordItem } from '../data/introWordsData';

type Assignment = 'intro' | 'not-intro' | null;

interface CardState {
  item: IntroWordItem;
  assignment: Assignment;
}

interface Mistake {
  display: string;
  chosen: string;
  correct: string;
}

type Phase = 'setup' | 'playing' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectWords(count: number): IntroWordItem[] {
  const introPool = shuffle(INTRO_WORDS.filter((w) => w.isIntro));
  const notIntroPool = shuffle(INTRO_WORDS.filter((w) => !w.isIntro));

  const minEach = 3;
  const maxIntro = count - minEach;
  const introCount = minEach + Math.floor(Math.random() * (maxIntro - minEach + 1));
  const notIntroCount = count - introCount;

  return shuffle([
    ...introPool.slice(0, introCount),
    ...notIntroPool.slice(0, notIntroCount),
  ]);
}

function wordDisplay(item: IntroWordItem): string {
  return item.note ? `${item.word} (${item.note})` : item.word;
}

interface Props {
  onBack: () => void;
}

export default function IntroWords({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [showDrill, setShowDrill] = useState(false);
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState<CardState[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const savedRef = useRef(false);

  const resultLabel = useMemo(
    () => pickResultLabel(cards.length > 0 ? finalCorrect / cards.length : 0),
    [finalCorrect, cards.length],
  );

  function startGame() {
    const words = selectWords(count);
    setCards(words.map((item) => ({ item, assignment: null })));
    setMistakes([]);
    savedRef.current = false;
    setPhase('playing');
  }

  function assign(idx: number, value: Assignment) {
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, assignment: value } : c)),
    );
  }

  function check() {
    const newMistakes: Mistake[] = [];
    let correct = 0;

    for (const card of cards) {
      const isCorrect =
        (card.assignment === 'intro') === card.item.isIntro;
      if (isCorrect) {
        correct++;
      } else {
        newMistakes.push({
          display: wordDisplay(card.item),
          chosen: card.assignment === 'intro' ? 'вводное' : 'не вводное',
          correct: card.item.isIntro ? 'вводное' : 'не вводное',
        });
      }
    }

    const total = cards.length;
    const score = Math.round((correct / total) * 100);

    if (!savedRef.current) {
      savedRef.current = true;
      saveResult(
        'intro-words',
        score,
        { correct, total, errors: newMistakes.length, mistakes: newMistakes },
        correct * 10,
      );
    }

    setMistakes(newMistakes);
    setFinalCorrect(correct);
    setPhase('result');
  }

  if (showDrill) {
    return (
      <ErrorDrill exerciseName="intro-words" mode="choice" onBack={() => setShowDrill(false)} />
    );
  }

  /* ─── Setup ─────────────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">💬</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Вводные слова</h1>
          <p className="text-gray-500 md:text-lg">
            Вводное или нет? Распределите слова по категориям
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-10 w-full shadow-sm flex flex-col gap-6 md:gap-8">
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

        <MistakesHistory exerciseName="intro-words" />

        <button
          onClick={() => setShowDrill(true)}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>🔁</span>
          <span>Работа над ошибками</span>
        </button>
      </div>
    );
  }

  /* ─── Result ─────────────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const total = cards.length;
    const pct = Math.round((finalCorrect / total) * 100);

    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-2xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 py-6 text-center shadow-sm w-full">
          <div className="text-5xl mb-3">
            {pct >= 90 ? '🎉' : pct >= 70 ? '👍' : '📚'}
          </div>
          <div className={`text-2xl md:text-3xl font-bold mb-1 ${toneToColor(resultLabel.tone)}`}>
            {resultLabel.label}
          </div>
          <div className="text-4xl md:text-5xl font-extrabold text-gray-800 mt-3">
            {finalCorrect} / {total}
          </div>
          <div className="text-gray-500 mt-1">{pct}% верно · +{finalCorrect * 10} очков</div>
        </div>

        {/* Cards result grid */}
        <div className="w-full">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Ваши ответы
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {cards.map((card, i) => {
              const isCorrect = (card.assignment === 'intro') === card.item.isIntro;
              const mistake = mistakes.find((m) => m.display === wordDisplay(card.item));
              return (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-sm font-medium border-2 flex flex-col items-center gap-0.5 ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}
                >
                  <span className="font-semibold">{card.item.word}</span>
                  {card.item.note && (
                    <span className="text-[10px] italic opacity-70">{card.item.note}</span>
                  )}
                  {!isCorrect && mistake && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md mt-0.5 font-semibold">
                      → {mistake.correct}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center w-full">
          <button
            onClick={startGame}
            className="flex-1 min-w-[140px] py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
          <button
            onClick={onBack}
            className="flex-1 min-w-[140px] py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-semibold glass text-gray-700 hover:bg-white/80 border border-white/60 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>

        <MistakesHistory exerciseName="intro-words" />

        <button
          onClick={() => setShowDrill(true)}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>🔁</span>
          <span>Работа над ошибками</span>
        </button>
      </div>
    );
  }

  /* ─── Playing ────────────────────────────────────────────────────────────── */
  const assigned = cards.filter((c) => c.assignment !== null).length;
  const allAssigned = assigned === cards.length;

  return (
    <div className="flex flex-col gap-4 py-4 md:py-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="glass px-3 py-2 rounded-xl text-gray-600 text-sm font-medium hover:bg-white/80 transition-all active:scale-95 border border-white/40 flex-shrink-0"
        >
          ← Назад
        </button>
        <div className="glass rounded-xl px-4 py-2 text-center flex-1">
          <span className="text-sm font-semibold text-gray-700">
            Распределено:{' '}
            <span className={allAssigned ? 'text-emerald-600' : 'text-indigo-600'}>
              {assigned} / {cards.length}
            </span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 justify-center text-xs font-semibold">
        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
          ✓ Вводное — выделяется запятыми
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
          ✗ Не вводное — запятые не нужны
        </span>
      </div>

      {/* Word cards */}
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
        {cards.map((card, i) => {
          const isIntroSelected = card.assignment === 'intro';
          const isNotIntroSelected = card.assignment === 'not-intro';

          return (
            <div
              key={i}
              className={`flex flex-col gap-2 rounded-2xl p-3 border-2 transition-all duration-200 min-w-[120px] max-w-[200px] ${
                isIntroSelected
                  ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
                  : isNotIntroSelected
                  ? 'bg-amber-50/90 border-amber-300 shadow-sm'
                  : 'bg-white/70 border-white/60 shadow-sm'
              }`}
            >
              {/* Word */}
              <div className="text-center">
                <div className="text-sm md:text-base font-semibold text-gray-800 leading-snug">
                  {card.item.word}
                </div>
                {card.item.note && (
                  <div className="text-[11px] text-gray-500 italic mt-0.5">
                    {card.item.note}
                  </div>
                )}
              </div>

              {/* Assignment buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => assign(i, isIntroSelected ? null : 'intro')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                    isIntroSelected
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                >
                  Вводное
                </button>
                <button
                  onClick={() => assign(i, isNotIntroSelected ? null : 'not-intro')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                    isNotIntroSelected
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700'
                  }`}
                >
                  Не вводное
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Check button */}
      <div className="flex flex-col items-center gap-2 pt-2">
        {!allAssigned && (
          <p className="text-xs text-gray-500">
            Осталось распределить: {cards.length - assigned}
          </p>
        )}
        <button
          onClick={check}
          disabled={!allAssigned}
          className={`w-full max-w-sm py-4 rounded-2xl text-lg font-semibold transition-all duration-200 active:scale-95 ${
            allAssigned
              ? 'text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-md hover:opacity-90'
              : 'text-gray-400 bg-white/40 border border-white/40 cursor-not-allowed'
          }`}
        >
          Проверить результат →
        </button>
      </div>
    </div>
  );
}
