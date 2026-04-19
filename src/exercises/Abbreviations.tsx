import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';
import MistakesHistory from '../components/MistakesHistory';

interface AbbreviationItem {
  abbr: string;
  full: string;
}

const ABBREVIATIONS: AbbreviationItem[] = [
  { abbr: 'РФ', full: 'Российская Федерация' },
  { abbr: 'КНР', full: 'Китайская Народная Республика' },
  { abbr: 'ООН', full: 'Организация Объединённых Наций' },
  { abbr: 'ФСБ', full: 'Федеральная служба безопасности' },
  { abbr: 'ГАИ', full: 'Государственная автомобильная инспекция' },
  { abbr: 'РАН', full: 'Российская академия наук' },
  { abbr: 'АЭС', full: 'Атомная электростанция' },
  { abbr: 'ГЭС', full: 'Гидроэлектростанция' },
  { abbr: 'ТЭЦ', full: 'Теплоэлектроцентраль' },
  { abbr: 'ВДНХ', full: 'Выставка достижений народного хозяйства' },
  { abbr: 'ЭКГ', full: 'Электрокардиограмма' },
  { abbr: 'БАД', full: 'Биологически активная добавка' },
  { abbr: 'МГУ', full: 'Московский государственный университет' },
  { abbr: 'НИИ', full: 'Научно-исследовательский институт' },
  { abbr: 'МФЦ', full: 'Многофункциональный центр' },
  { abbr: 'МХАТ', full: 'Московский Художественный академический театр' },
  { abbr: 'МХТ', full: 'Московский Художественный театр имени А.П. Чехова' },
  { abbr: 'ЕГЭ', full: 'Единый государственный экзамен' },
  { abbr: 'СНГ', full: 'Содружество Независимых Государств' },
  { abbr: 'МВД', full: 'Министерство внутренних дел' },
  { abbr: 'МЧС', full: 'Министерство по чрезвычайным ситуациям' },
  { abbr: 'РИА', full: 'Российское информационное агентство' },
  { abbr: 'ЧП', full: 'Чрезвычайное происшествие' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'setup' | 'playing' | 'result';

interface Props {
  onBack: () => void;
}

export default function Abbreviations({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [items, setItems] = useState<AbbreviationItem[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState<AbbreviationItem[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cardColor, setCardColor] = useState<'neutral' | 'green' | 'red'>('neutral');
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const savedRef = useRef(false);
  const controls = useAnimation();

  function startGame() {
    const selected = shuffle(ABBREVIATIONS).slice(0, Math.min(count, ABBREVIATIONS.length));
    setItems(selected);
    setIndex(0);
    setCorrect(0);
    setMistakes([]);
    setIsFlipped(false);
    setLocked(false);
    setCardColor('neutral');
    savedRef.current = false;
    controls.set({ x: 0, opacity: 1 });
    setPhase('playing');
  }

  function handleFlip() {
    if (locked || isFlipped) return;
    setIsFlipped(true);
  }

  async function handleAnswer(isCorrect: boolean) {
    if (locked || !isFlipped) return;
    setLocked(true);

    const newCorrect = isCorrect ? correct + 1 : correct;
    const current = items[index];
    const newMistakes = isCorrect ? mistakes : [...mistakes, current];
    if (!isCorrect) setMistakes(newMistakes);
    setCardColor(isCorrect ? 'green' : 'red');

    await new Promise<void>((r) => setTimeout(r, 250));

    await controls.start({
      x: isCorrect ? 380 : -380,
      opacity: 0,
      transition: { duration: 0.38, ease: 'easeIn' },
    });

    const nextIndex = index + 1;
    const total = items.length;

    if (nextIndex >= total) {
      const score = Math.round((newCorrect / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('abbreviations', score, {
          correct: newCorrect,
          total,
          errors: total - newCorrect,
          mistakes: newMistakes,
        });
      }
      setFinalCorrect(newCorrect);
      setFinalTotal(total);
      setPhase('result');
      return;
    }

    setCorrect(newCorrect);
    setIndex(nextIndex);
    setIsFlipped(false);
    setLocked(false);
    setCardColor('neutral');
    controls.set({ x: 0, opacity: 1 });
  }

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
        <div className="glass rounded-3xl px-10 py-7 text-center shadow-sm">
          <div className="text-5xl mb-4 animate-float">🔤</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Аббревиатуры</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Переворачивайте карточки и проверяйте, знаете ли вы расшифровку аббревиатуры
          </p>
        </div>

        <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-sm flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
              Количество карточек
            </p>
            <div className="flex gap-2 justify-center">
              {[10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
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

          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Начать
          </button>
        </div>

        <MistakesHistory exerciseName="abbreviations" />
      </div>
    );
  }

  /* ─── Result ─── */
  if (phase === 'result') {
    const pct = finalTotal > 0 ? finalCorrect / finalTotal : 0;
    const scoreColor = pct >= 0.8 ? 'text-emerald-600' : 'text-amber-500';
    const label =
      pct >= 0.9 ? '🎉 Отлично!'
      : pct >= 0.8 ? '✨ Хороший результат'
      : pct >= 0.65 ? '👍 Неплохо'
      : pct >= 0.5 ? '💪 Есть над чем поработать'
      : '📚 Стоит повторить тему';

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
              Не знал ({mistakes.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {mistakes.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="font-bold text-gray-800 shrink-0 tracking-wide">{m.abbr}</span>
                  <span className="text-gray-600 text-right leading-snug">{m.full}</span>
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

  const cardBgClass =
    cardColor === 'green'
      ? 'bg-emerald-100/80'
      : cardColor === 'red'
      ? 'bg-red-100/80'
      : 'bg-white/85';

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      {/* Progress bar */}
      <div className="w-full max-w-md">
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

      {/* Flip card */}
      <motion.div
        animate={controls}
        className="w-full max-w-md"
        style={{ height: 300 }}
      >
        <div key={index} className="card-3d w-full h-full" onClick={handleFlip} style={{ cursor: isFlipped ? 'default' : 'pointer' }}>
          <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div
              className={`card-face rounded-2xl border border-white/60 shadow-md backdrop-blur-md flex flex-col items-center justify-center gap-3 ${cardBgClass} transition-colors duration-200`}
            >
              <span className="text-6xl font-bold text-gray-800 tracking-wide">{current.abbr}</span>
              <span className="text-sm text-gray-400 mt-2">Нажмите, чтобы перевернуть</span>
            </div>

            {/* Back */}
            <div
              className={`card-back card-face rounded-2xl border border-white/60 shadow-md backdrop-blur-md overflow-hidden ${cardBgClass} transition-colors duration-200`}
              style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
            >
              {/* Top: full text */}
              <div className="flex items-center justify-center px-6 py-4 h-[55%]">
                <span className="text-xl font-semibold text-gray-800 text-center leading-snug">
                  {current.full}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200/60 mx-4" />

              {/* Bottom: two click zones */}
              <div className="flex h-[45%]">
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-red-50/60 transition-colors duration-150 rounded-bl-2xl"
                  onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
                >
                  <span className="text-2xl">❌</span>
                  <span className="text-sm font-semibold text-red-500">Не знал</span>
                </div>
                <div className="w-px bg-gray-200/60" />
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-emerald-50/60 transition-colors duration-150 rounded-br-2xl"
                  onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
                >
                  <span className="text-2xl">✅</span>
                  <span className="text-sm font-semibold text-emerald-600">Знал</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hint when not flipped */}
      {!isFlipped && (
        <p className="text-sm text-gray-400 animate-fade-in">
          Кликните на карточку, чтобы увидеть расшифровку
        </p>
      )}
    </div>
  );
}
