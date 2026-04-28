import { useState, useRef, useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import ErrorDrill from './ErrorDrill';
import { INTRO_WORDS, type IntroWordItem } from '../data/introWordsData';

type Zone = 'pool' | 'intro' | 'not-intro';

interface CardState {
  item: IntroWordItem;
  zone: Zone;
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
  const introCount = minEach + Math.floor(Math.random() * (count - minEach * 2 + 1));
  return shuffle([
    ...introPool.slice(0, introCount),
    ...notIntroPool.slice(0, count - introCount),
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
  const [hoverZone, setHoverZone] = useState<Zone | null>(null);
  const savedRef = useRef(false);
  const introZoneRef = useRef<HTMLDivElement>(null);
  const notIntroZoneRef = useRef<HTMLDivElement>(null);

  const resultLabel = useMemo(
    () => pickResultLabel(cards.length > 0 ? finalCorrect / cards.length : 0),
    [finalCorrect, cards.length],
  );

  function getTargetZone(clientX: number, clientY: number): 'intro' | 'not-intro' | null {
    const pad = 12;
    const iR = introZoneRef.current?.getBoundingClientRect();
    const nR = notIntroZoneRef.current?.getBoundingClientRect();
    if (iR && clientX >= iR.left - pad && clientX <= iR.right + pad && clientY >= iR.top - pad && clientY <= iR.bottom + pad) return 'intro';
    if (nR && clientX >= nR.left - pad && clientX <= nR.right + pad && clientY >= nR.top - pad && clientY <= nR.bottom + pad) return 'not-intro';
    return null;
  }

  function startGame() {
    const words = selectWords(count);
    setCards(words.map((item) => ({ item, zone: 'pool' })));
    setMistakes([]);
    savedRef.current = false;
    setHoverZone(null);
    setPhase('playing');
  }

  function moveCard(idx: number, zone: Zone) {
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, zone } : c)));
  }

  function check() {
    const newMistakes: Mistake[] = [];
    let correct = 0;
    for (const card of cards) {
      const isCorrect = (card.zone === 'intro') === card.item.isIntro;
      if (isCorrect) {
        correct++;
      } else {
        newMistakes.push({
          display: wordDisplay(card.item),
          chosen: card.zone === 'intro' ? 'вводное' : 'не вводное',
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
    return <ErrorDrill exerciseName="intro-words" mode="choice" onBack={() => setShowDrill(false)} />;
  }

  /* ─── Setup ───────────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">💬</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Вводные слова</h1>
          <p className="text-gray-500 md:text-lg">Перетащите слова в нужную группу</p>
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

  /* ─── Result ──────────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const total = cards.length;
    const pct = Math.round((finalCorrect / total) * 100);
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-2xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 py-6 text-center shadow-sm w-full">
          <div className="text-5xl mb-3">{pct >= 90 ? '🎉' : pct >= 70 ? '👍' : '📚'}</div>
          <div className={`text-2xl md:text-3xl font-bold mb-1 ${toneToColor(resultLabel.tone)}`}>
            {resultLabel.label}
          </div>
          <div className="text-4xl md:text-5xl font-extrabold text-gray-800 mt-3">
            {finalCorrect} / {total}
          </div>
          <div className="text-gray-500 mt-1">{pct}% верно · +{finalCorrect * 10} очков</div>
        </div>

        <div className="w-full">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Ваши ответы
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {cards.map((card, i) => {
              const isCorrect = (card.zone === 'intro') === card.item.isIntro;
              const mistake = mistakes.find((m) => m.display === wordDisplay(card.item));
              return (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-sm font-medium border-2 flex flex-col items-center gap-0.5 ${
                    isCorrect
                      ? 'bg-violet-50 border-violet-300 text-violet-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}
                >
                  <span className="font-semibold">{card.item.word}</span>
                  {card.item.note && (
                    <span className="text-[10px] italic opacity-70">{card.item.note}</span>
                  )}
                  {!isCorrect && mistake && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md mt-0.5 font-semibold">
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

  /* ─── Playing ─────────────────────────────────────────────────────────── */
  const poolCards = cards.filter((c) => c.zone === 'pool');
  const introCards = cards.filter((c) => c.zone === 'intro');
  const notIntroCards = cards.filter((c) => c.zone === 'not-intro');
  const placed = introCards.length + notIntroCards.length;
  const allPlaced = placed === cards.length;

  return (
    <div className="flex flex-col gap-3 py-3 md:py-5 w-full max-w-5xl mx-auto px-2 animate-fade-in">

      {/* Progress bar */}
      <div className="glass rounded-xl px-4 py-2.5 text-center">
        <span className="text-sm font-semibold text-gray-700">
          Распределено:{' '}
          <span className={allPlaced ? 'text-violet-600' : 'text-indigo-600'}>
            {placed} / {cards.length}
          </span>
        </span>
      </div>

      {/* Main area: 3-col on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-3">

        {/* LEFT / TOP — ВВОДНЫЕ */}
        <DropZone
          ref={introZoneRef}
          label="ВВОДНЫЕ СЛОВА"
          hint="выделяются запятыми"
          variant="intro"
          isActive={hoverZone === 'intro'}
          isEmpty={introCards.length === 0}
          mobileHint="↑ Перетащите сюда"
          desktopHint="← Перетащите сюда"
        >
          {introCards.map((card) => {
            const idx = cards.indexOf(card);
            return (
              <PlacedChip
                key={idx}
                item={card.item}
                variant="intro"
                onClick={() => moveCard(idx, 'pool')}
              />
            );
          })}
        </DropZone>

        {/* CENTER — draggable pool */}
        <div className="glass rounded-2xl p-3 md:p-4 md:flex-1 min-h-[100px] md:min-h-[280px] flex flex-col justify-center">
          {poolCards.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Все слова распределены</p>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center content-start">
              {poolCards.map((card) => {
                const idx = cards.indexOf(card);
                return (
                  <DraggableCard
                    key={idx}
                    item={card.item}
                    onDrag={(x, y) => setHoverZone(getTargetZone(x, y))}
                    onDragEnd={(x, y) => {
                      setHoverZone(null);
                      const zone = getTargetZone(x, y);
                      if (zone) moveCard(idx, zone);
                    }}
                  />
                );
              })}
            </div>
          )}
          {poolCards.length > 0 && (
            <p className="text-center text-[11px] text-gray-400 mt-2 md:mt-3">
              <span className="md:hidden">↑ Перетащите в нужную зону ↓</span>
              <span className="hidden md:inline">← Перетащите в нужную зону →</span>
            </p>
          )}
        </div>

        {/* RIGHT / BOTTOM — НЕ ВВОДНЫЕ */}
        <DropZone
          ref={notIntroZoneRef}
          label="НЕ ВВОДНЫЕ"
          hint="запятые не нужны"
          variant="not-intro"
          isActive={hoverZone === 'not-intro'}
          isEmpty={notIntroCards.length === 0}
          mobileHint="↓ Перетащите сюда"
          desktopHint="Перетащите сюда →"
        >
          {notIntroCards.map((card) => {
            const idx = cards.indexOf(card);
            return (
              <PlacedChip
                key={idx}
                item={card.item}
                variant="not-intro"
                onClick={() => moveCard(idx, 'pool')}
              />
            );
          })}
        </DropZone>
      </div>

      {/* Check button */}
      <button
        onClick={check}
        disabled={!allPlaced}
        className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-200 active:scale-95 ${
          allPlaced
            ? 'text-white bg-gradient-to-r from-violet-500 to-indigo-600 shadow-md hover:opacity-90'
            : 'text-gray-400 bg-white/40 border border-white/40 cursor-not-allowed'
        }`}
      >
        {allPlaced ? 'Проверить результат →' : `Осталось: ${cards.length - placed}`}
      </button>
    </div>
  );
}

/* ─── DropZone ──────────────────────────────────────────────────────────── */

interface DropZoneProps {
  label: string;
  hint: string;
  variant: 'intro' | 'not-intro';
  isActive: boolean;
  isEmpty: boolean;
  mobileHint: string;
  desktopHint: string;
  children: React.ReactNode;
}

const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(
  ({ label, hint, variant, isActive, isEmpty, mobileHint, desktopHint, children }, ref) => {
    const isIntro = variant === 'intro';

    const baseBg = isIntro ? 'bg-violet-50/70 border-violet-300' : 'bg-white/60 border-gray-300';
    const activeBg = isIntro
      ? 'bg-violet-100/90 border-violet-500 shadow-violet-200'
      : 'bg-white/90 border-gray-500 shadow-gray-200';
    const labelColor = isIntro ? 'text-violet-700' : 'text-gray-600';
    const hintColor = isIntro ? 'text-violet-400' : 'text-gray-400';
    const emptyColor = isIntro ? 'text-violet-300' : 'text-gray-400';
    const icon = isIntro ? '✦' : '○';

    return (
      <motion.div
        ref={ref}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
        className={`rounded-2xl border-2 border-dashed p-3 md:p-4 min-h-[90px] md:min-h-[280px] md:w-[280px] md:flex-shrink-0 transition-colors duration-150 shadow-sm flex flex-col ${
          isActive ? activeBg : baseBg
        }`}
      >
        {/* Zone header */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black tracking-widest uppercase ${labelColor}`}>
              {icon} {label}
            </span>
          </div>
          <div className={`text-[10px] ${hintColor}`}>{hint}</div>
        </div>

        {/* Placed words / empty hint */}
        <div className="flex-1 flex flex-col justify-center">
          {isEmpty ? (
            <p className={`text-xs text-center py-2 ${emptyColor}`}>
              <span className="md:hidden">{mobileHint}</span>
              <span className="hidden md:inline">{desktopHint}</span>
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {children}
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

/* ─── PlacedChip ────────────────────────────────────────────────────────── */

function PlacedChip({
  item,
  variant,
  onClick,
}: {
  item: IntroWordItem;
  variant: 'intro' | 'not-intro';
  onClick: () => void;
}) {
  const cls =
    variant === 'intro'
      ? 'bg-violet-200/80 text-violet-800 hover:bg-violet-300/80'
      : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80';
  return (
    <button
      onClick={onClick}
      title="Вернуть"
      className={`${cls} rounded-lg px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 flex flex-col items-center leading-snug`}
    >
      <span>{item.word}</span>
      {item.note && <span className="text-[9px] italic opacity-70">{item.note}</span>}
    </button>
  );
}

/* ─── DraggableCard ─────────────────────────────────────────────────────── */

function DraggableCard({
  item,
  onDrag,
  onDragEnd,
}: {
  item: IntroWordItem;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.08}
      whileDrag={{ scale: 1.1, boxShadow: '0 10px 28px rgba(99,102,241,0.25)', zIndex: 50, opacity: 0.95 }}
      whileHover={{ scale: 1.04, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      onDrag={(_, info) => onDrag(info.point.x, info.point.y)}
      onDragEnd={(_, info) => onDragEnd(info.point.x, info.point.y)}
      style={{ touchAction: 'none', cursor: 'grab' }}
      className="bg-white/90 backdrop-blur-sm border border-white/70 rounded-xl px-3 py-2.5 shadow-sm select-none flex flex-col items-center gap-0.5"
    >
      <span className="text-sm md:text-base font-semibold text-gray-800 whitespace-nowrap">
        {item.word}
      </span>
      {item.note && (
        <span className="text-[10px] text-gray-500 italic">{item.note}</span>
      )}
    </motion.div>
  );
}
