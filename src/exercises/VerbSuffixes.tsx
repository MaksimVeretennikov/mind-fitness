import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import MistakesHistory from '../components/MistakesHistory';
import ErrorDrill from './ErrorDrill';

interface TextItem {
  display: string;
  answer: string;
}

interface Mistake {
  display: string;
  chosen: string;
  correct: string;
}

const ITEMS: TextItem[] = [
  { display: 'ссор_щиеся ребята',               answer: 'ссорящиеся' },
  { display: 'дорогосто_щее',                    answer: 'дорогостоящее' },
  { display: 'самокле_щиеся',                    answer: 'самоклеящиеся' },
  { display: 'бор_щийся',                        answer: 'борющийся' },
  { display: 'они кол_т',                        answer: 'колют' },
  { display: 'зерна перемел_тся',                answer: 'перемелются' },
  { display: 'постигн_шь умом',                  answer: 'постигнешь' },
  { display: 'бре_шься',                         answer: 'бреешься' },
  { display: 'предвид_вший',                     answer: 'предвидевший' },
  { display: 'неприемл_мый',                     answer: 'неприемлемый' },
  { display: 'незыбл_мый',                       answer: 'незыблемый' },
  { display: 'увенч_нный',                       answer: 'увенчанный' },
  { display: 'леле_шь',                          answer: 'лелеешь' },
  { display: 'се_щий',                           answer: 'сеющий' },
  { display: 'пол_щий грядку',                   answer: 'полющий' },
  { display: 'непререка_мый',                    answer: 'непререкаемый' },
  { display: 'клянч_щий конфету',                answer: 'клянчащий' },
  { display: 'в колыш_щейся ржи',               answer: 'колышущейся' },
  { display: 'защебеч_т птицы',                  answer: 'защебечут' },
  { display: 'лесорубы пил_т',                   answer: 'пилят' },
  { display: 'маляры бел_т',                     answer: 'белят' },
  { display: 'лепеч_шь',                         answer: 'лепечешь' },
  { display: 'волки рыщ_т',                      answer: 'рыщут' },
  { display: 'рокоч_щий мотор',                  answer: 'рокочущий' },
  { display: 'ножи точ_тся',                     answer: 'точатся' },
  { display: 'ветры разве_т',                    answer: 'развеют' },
  { display: 'фермеры се_т',                     answer: 'сеют' },
  { display: 'беспоко_щийся',                    answer: 'беспокоящийся' },
  { display: 'подстрел_нный хищник',             answer: 'подстреленный' },
  { display: 'стел_тся туман',                   answer: 'стелется' },
  { display: 'травы колебл_тся',                 answer: 'колеблются' },
  { display: 'ка_щийся',                         answer: 'кающийся' },
  { display: 'курлыч_щие',                       answer: 'курлычущие' },
  { display: 'подта_вший',                       answer: 'подтаявший' },
  { display: 'дремл_шь',                         answer: 'дремлешь' },
  { display: 'снега присыпл_т',                  answer: 'присыплют' },
  { display: 'они посел_тся',                    answer: 'поселятся' },
  { display: 'обид_вшийся на всех',              answer: 'обидевшийся' },
  { display: 'трепещ_щий от страха',             answer: 'трепещущий' },
  { display: 'выкач_нный из гаража автомобиль',  answer: 'выкаченный' },
  { display: 'ягнята забле_т',                   answer: 'заблеют' },
  { display: 'снега припорош_т',                 answer: 'припорошат' },
  { display: 'пчелы ужал_т',                     answer: 'ужалят' },
  { display: 'подкле_нный',                      answer: 'подклеенный' },
  { display: 'скач_нный файл',                   answer: 'скачанный' },
  { display: 'они плещ_тся',                     answer: 'плещутся' },
  { display: 'родители тревож_тся',              answer: 'тревожатся' },
  { display: 'кузнечики стрекоч_т',              answer: 'стрекочут' },
  { display: 'колебл_шься',                      answer: 'колеблешься' },
  { display: 'рассе_нный',                       answer: 'рассеянный' },
  { display: 'пастухи гон_т овец',               answer: 'гонят' },
  { display: 'ненавид_мый',                      answer: 'ненавидимый' },
  { display: 'собаки чу_т',                      answer: 'чуют' },
  { display: 'щур_щийся',                        answer: 'щурящийся' },
  { display: 'животрепещ_щий',                   answer: 'животрепещущий' },
  { display: 'скач_щий на коне',                 answer: 'скачущий' },
  { display: 'завис_шь',                         answer: 'зависишь' },
  { display: 'ре_щий стяг',                      answer: 'реющий' },
  { display: 'планы руш_тся',                    answer: 'рушатся' },
  { display: 'предвид_мый',                      answer: 'предвидимый' },
  { display: 'кулинары замес_т',                 answer: 'замесят' },
  { display: 'потер_нный',                       answer: 'потерянный' },
  { display: 'повенч_нный',                      answer: 'повенчанный' },
  { display: 'знач_мый',                         answer: 'значимый' },
];

// Table layout: [col1, col2] rows
const TABLE: [string, string][] = [
  ['Е', 'И'],
  ['У', 'А'],
  ['Ю', 'Я'],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMissingLetter(display: string, answer: string): string {
  const blankWord = display.split(' ').find(w => w.includes('_'))!;
  for (let i = 0; i < blankWord.length; i++) {
    if (blankWord[i] === '_') return answer[i].toUpperCase();
  }
  return '';
}

/** Fill the blank word in display with the given letter (lowercase). */
function fillBlank(display: string, letter: string): string {
  const blankWord = display.split(' ').find(w => w.includes('_'))!;
  return blankWord.replace('_', letter.toLowerCase());
}

interface Props {
  onBack: () => void;
}

export default function VerbSuffixes({ onBack }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [showDrill, setShowDrill] = useState(false);
  const [count, setCount] = useState(10);
  const [words, setWords] = useState<TextItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [clicked, setClicked] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [locked, setLocked] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const savedRef = useRef(false);
  const controls = useAnimation();
  const [renderKey, setRenderKey] = useState(0);

  const resultLabel = useMemo(
    () => pickResultLabel(finalTotal > 0 ? finalCorrect / finalTotal : 0),
    [finalCorrect, finalTotal],
  );

  const currentWord = words[index];
  const correctLetter = currentWord ? getMissingLetter(currentWord.display, currentWord.answer) : '';

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [renderKey, phase]);

  function startGame() {
    const selected = shuffle(ITEMS).slice(0, count);
    setWords(selected);
    setIndex(0);
    setMistakes([]);
    setClicked(null);
    setIsCorrect(null);
    setRevealCorrect(false);
    setLocked(false);
    savedRef.current = false;
    setPhase('playing');
    setRenderKey(k => k + 1);
  }

  async function handleClick(letter: string) {
    if (locked) return;
    setLocked(true);
    setClicked(letter);
    const correct = letter === correctLetter;
    setIsCorrect(correct);

    if (correct) {
      await controls.start({
        x: 380, opacity: 0, scale: 0.88,
        transition: { duration: 0.38, ease: 'easeIn' },
      });
      advanceTo(index + 1, mistakes);
    } else {
      // Red flash — record mistake and auto-advance
      const newMistakes: Mistake[] = [
        ...mistakes,
        {
          display: currentWord.display,
          chosen: fillBlank(currentWord.display, letter),
          correct: currentWord.answer,
        },
      ];
      setMistakes(newMistakes);
      // Red flash
      await new Promise<void>(r => setTimeout(r, 600));
      // Show correct answer
      setRevealCorrect(true);
      await new Promise<void>(r => setTimeout(r, 1300));
      await controls.start({
        y: 70, opacity: 0,
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
          'verb-suffixes',
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
    setClicked(null);
    setIsCorrect(null);
    setRevealCorrect(false);
    setLocked(false);
    controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    setRenderKey(k => k + 1);
  }

  if (showDrill) {
    return <ErrorDrill exerciseName="verb-suffixes" mode="choice" onBack={() => setShowDrill(false)} />;
  }

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-2">
        <div className="glass rounded-3xl px-8 md:px-10 py-6 md:py-7 text-center shadow-sm w-full">
          <div className="text-5xl md:text-6xl mb-4 animate-float">🖊️</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Суффиксы глаголов и причастий</h1>
          <p className="text-gray-500 md:text-lg">Выберите правильную букву из таблицы</p>
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

        <MistakesHistory exerciseName="verb-suffixes" />

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

  /* ─── Result ─── */
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
                <div key={i} className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-400 shrink-0 text-xs leading-6">{m.display}</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through">{m.chosen}</span>
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">{m.correct}</span>
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

  /* ─── Playing ─── */
  const progressPct = (index / words.length) * 100;

  // Determine card background based on state
  const cardBg =
    revealCorrect || isCorrect === true ? 'rgba(134,239,172,0.55)'
    : isCorrect === false ? 'rgba(252,165,165,0.15)'
    : 'rgba(255,255,255,0.85)';

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      {/* Progress */}
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
        className="w-full max-w-md flex flex-col items-center gap-5"
      >
        {/* Word card */}
        <div
          className="w-full rounded-2xl px-8 py-7 shadow-md border border-white/60 backdrop-blur-md transition-colors duration-200 text-center"
          style={{ backgroundColor: cardBg }}
        >
          <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
            {currentWord.display.split('_').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{
                    borderBottom: `2.5px solid ${revealCorrect ? '#16a34a' : '#4f46e5'}`,
                    display: 'inline-block',
                    width: '1.1em',
                    color: revealCorrect ? '#1f2937' : 'transparent',
                    textAlign: 'center',
                  }}>
                    {revealCorrect ? correctLetter.toLowerCase() : '_'}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Letter table */}
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '320px' }}
        >
          {TABLE.map(([left, right]) => (
            [left, right].map(letter => {
              const isClicked = clicked === letter;
              const isThisCorrect = letter === correctLetter;
              // After reveal: correct button goes green, wrong clicked stays red
              const btnCorrect = revealCorrect ? isThisCorrect : (isClicked && isCorrect === true);
              const btnWrong = revealCorrect ? (isClicked && !isThisCorrect) : (isClicked && isCorrect === false);

              let btnClass = 'py-4 rounded-2xl text-2xl font-bold transition-all duration-200 active:scale-95 ';
              if (btnCorrect) {
                btnClass += 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-md';
              } else if (btnWrong) {
                btnClass += 'bg-red-100 text-red-500 border-2 border-red-300';
              } else {
                btnClass += 'bg-white/70 text-gray-700 border border-white/60 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm';
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleClick(letter)}
                  disabled={locked && !isClicked}
                  className={btnClass}
                >
                  {letter}
                </button>
              );
            })
          ))}
        </div>
      </motion.div>
    </div>
  );
}
