import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';

/* ─── Word Bank ─────────────────────────────────────────────────────────────── */

const ADVERBS_SLITNO = [
  'вблизи', 'вбок', 'вброд', 'вверх', 'вглубь', 'вдалеке', 'вдали', 'вдаль',
  'вдвое', 'вдвоём', 'взаперти', 'вконец', 'влево', 'вместе', 'вмиг', 'вначале',
  'вниз', 'внизу', 'вничью', 'внутри', 'внутрь', 'вовремя', 'вовсю', 'воедино',
  'вокруг', 'вообще', 'впервые', 'впереди', 'вперемешку', 'вперёд', 'вплотную',
  'вполголоса', 'вполоборота', 'вполсилы', 'впоследствии', 'впотьмах', 'вправду',
  'вправе', 'вправо', 'впрочем', 'врассыпную', 'врастяжку', 'всерьёз', 'всецело',
  'вскользь', 'вскоре', 'вслед', 'вслепую', 'всплошную', 'втайне', 'втрое',
  'втроём', 'вширь',
  'добела', 'доверху', 'донельзя', 'досуха', 'досыта', 'дочиста',
  'замуж', 'заодно', 'затем', 'зачастую', 'зачем',
  'издавна', 'издалека', 'изнутри', 'итак',
  'кверху', 'кряду', 'кстати',
  'набок', 'навек', 'наверх', 'наверху', 'навзничь', 'навсегда', 'навстречу',
  'надвое', 'наедине', 'назавтра', 'назад', 'назло', 'назубок', 'наизусть',
  'накануне', 'наконец', 'налево', 'наоборот', 'наперегонки', 'наперекор',
  'наперёд', 'напоказ', 'наполовину', 'направо', 'напротив', 'напрямую',
  'наравне', 'нараспашку', 'наружу', 'насквозь', 'насколько', 'насмерть',
  'насовсем', 'наспех', 'настежь', 'настолько', 'натрое', 'наугад', 'наутёк', 'наутро',
  'откуда', 'отсюда', 'оттого', 'оттуда', 'отчасти', 'отчего',
  'поближе', 'побольше', 'побыстрее', 'поверху', 'повсюду', 'позади', 'поистине',
  'поменьше', 'помимо', 'поначалу', 'поневоле', 'понемногу', 'поодиночке',
  'поровну', 'попросту', 'поскорее', 'посреди', 'посредине', 'потому',
  'поочерёдно', 'почему', 'поэтому',
  'сбоку', 'сверху', 'сейчас', 'сзади', 'слева', 'снаружи', 'сначала',
  'снизу', 'снова', 'совсем', 'сразу', 'сплеча', 'справа',
  'тотчас',
];

const ADVERBS_RAZDELNO = [
  'без оглядки', 'без разбору', 'без спросу', 'без толку', 'без умолку', 'бок о бок',
  'в виде', 'в глаза', 'в заключение', 'в конце концов', 'вне зависимости',
  'в обнимку', 'в обтяжку', 'в общем', 'во власти', 'в одиночку', 'во избежание',
  'в открытую', 'в потёмках', 'в розницу', 'в сердцах', 'всё равно', 'в ходу',
  'в упор', 'в целом',
  'до сих пор', 'до завтра', 'до конца',
  'за глаза', 'за границей', 'за границу',
  'как раз', 'как только', 'к вечеру', 'к утру',
  'на бегу', 'на вид', 'на виду', 'на глаз', 'на глазок', 'на днях', 'на лету',
  'на миг', 'на ощупь', 'на радостях', 'на редкость', 'на совесть', 'на убыль', 'на ходу',
  'по временам', 'по двое', 'по крайней мере', 'по мере', 'по одному', 'по очереди',
  'по памяти', 'по праву', 'по совести', 'по ходу', 'по трое', 'про себя',
  'с виду', 'след в след', 'со временем', 'с полуслова', 'с разбегу', 'с размаху', 'с ходу',
];

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type Phase = 'setup' | 'playing' | 'result';

interface WordItem {
  word: string;
  answer: 'слитно' | 'раздельно';
}

interface Mistake {
  word: string;
  userAnswer: 'слитно' | 'раздельно';
  correct: 'слитно' | 'раздельно';
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL = ADVERBS_SLITNO.length + ADVERBS_RAZDELNO.length;

/* ─── Component ─────────────────────────────────────────────────────────────── */

interface Props {
  onBack: () => void;
}

export default function Adverbs({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [words, setWords] = useState<WordItem[]>([]);
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

  // Animate the card in whenever cardKey changes
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [renderKey, phase]);

  function startGame() {
    const all: WordItem[] = [
      ...ADVERBS_SLITNO.map(w => ({ word: w, answer: 'слитно' as const })),
      ...ADVERBS_RAZDELNO.map(w => ({ word: w, answer: 'раздельно' as const })),
    ];
    const n = count >= TOTAL ? all.length : count;
    const selected = shuffle(all).slice(0, n);
    setWords(selected);
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

    const current = words[index];
    const isCorrect = answer === current.answer;

    if (isCorrect) {
      // Green flash → slide right
      setCardBg('rgba(134, 239, 172, 0.55)');
      await controls.start({
        x: 380,
        opacity: 0,
        scale: 0.88,
        transition: { duration: 0.38, ease: 'easeIn' },
      });
      advanceTo(index + 1, mistakes, true);
    } else {
      // Record mistake
      const newMistakes = [
        ...mistakes,
        { word: current.word, userAnswer: answer, correct: current.answer },
      ];
      setMistakes(newMistakes);

      // Red shake
      setCardBg('rgba(252, 165, 165, 0.55)');
      setShaking(true);
      await new Promise<void>(r => setTimeout(r, 520));
      setShaking(false);

      // Reveal correct answer
      setRevealText(current.answer);
      setCardBg('rgba(134, 239, 172, 0.45)');
      await new Promise<void>(r => setTimeout(r, 1500));

      // Slide down
      await controls.start({
        y: 70,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      });
      advanceTo(index + 1, newMistakes, false);
    }
  }

  function advanceTo(nextIndex: number, currentMistakes: Mistake[], wasCorrect: boolean) {
    const correct = nextIndex - currentMistakes.length;
    const total = words.length;

    if (nextIndex >= total) {
      const score = Math.round((correct / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('adverbs', score, {
          correct,
          total,
          errors: currentMistakes.length,
        });
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

    // Suppress unused variable warning
    void wasCorrect;
  }

  /* ─── Setup Screen ──────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    const options = [10, 20, 30, TOTAL];
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">📝</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Правописание наречий</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Слитно или раздельно? Выберите количество слов
          </p>
        </div>

        <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-sm flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
              Количество слов
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {options.map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {n >= TOTAL ? `Все (${TOTAL})` : n}
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
      </div>
    );
  }

  /* ─── Result Screen ─────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const pct = finalTotal > 0 ? finalCorrect / finalTotal : 0;
    const scoreColor =
      pct >= 0.8 ? 'text-emerald-600' : pct >= 0.5 ? 'text-amber-500' : 'text-red-500';
    const label =
      pct >= 0.8 ? '🎉 Отлично!' : pct >= 0.5 ? '👍 Неплохо!' : '📚 Нужно потренироваться';

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto">
        {/* Score */}
        <div className="text-center">
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>
            {finalCorrect} / {finalTotal}
          </div>
          <p className="text-gray-500 text-xl">{label}</p>
        </div>

        {/* Mistakes list */}
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
                  <span className="text-gray-800 font-medium">{m.word}</span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {m.correct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
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

  /* ─── Playing Screen ────────────────────────────────────────────────────── */
  const currentWord = words[index];
  const progressPct = (index / words.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
          <span>
            {index + 1} / {words.length}
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

      {/* Word card */}
      <motion.div
        animate={controls}
        className={`w-full max-w-md rounded-2xl p-10 shadow-md border border-white/60 flex flex-col items-center gap-4 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <p className="text-4xl font-bold text-gray-800 text-center leading-tight">
          {currentWord.word}
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

      {/* Answer buttons */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => handleAnswer('слитно')}
          disabled={locked}
          className="flex-1 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          СЛИТНО
        </button>
        <button
          onClick={() => handleAnswer('раздельно')}
          disabled={locked}
          className="flex-1 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          РАЗДЕЛЬНО
        </button>
      </div>
    </div>
  );
}
