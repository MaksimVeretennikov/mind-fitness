import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { saveResult } from '../lib/auth';
import {
  STRIKEOUT_WORDS,
  RU_ALPHABET,
  type StrikeoutDifficulty,
} from '../data/letterStrikeoutWords';

interface DiffCfg {
  label: string;
  desc: string;
  noisePerLetter: number; // how many copies of each noise letter
  noiseCount: number;     // how many distinct noise letters
}

const DIFF: Record<StrikeoutDifficulty, DiffCfg> = {
  easy:   { label: 'Лёгкая',  desc: '3–4 буквы · мало помех', noisePerLetter: 2, noiseCount: 6 },
  medium: { label: 'Средняя', desc: '5–6 букв · больше помех', noisePerLetter: 2, noiseCount: 9 },
  hard:   { label: 'Трудная', desc: '7–8 букв · максимум помех', noisePerLetter: 3, noiseCount: 7 },
};

type Phase = 'settings' | 'playing' | 'result';

interface Cell {
  ch: string;
  isTarget: boolean; // true = part of the hidden word
  struck: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWord(diff: StrikeoutDifficulty): string {
  const pool = STRIKEOUT_WORDS[diff];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildSequence(word: string, diff: StrikeoutDifficulty): Cell[] {
  const cfg = DIFF[diff];
  const wordChars = word.split('');
  const wordSet = new Set(wordChars);

  // Pick noise letters that don't collide with the target word.
  const noisePool = shuffle(RU_ALPHABET.filter(l => !wordSet.has(l)));
  const noiseLetters = noisePool.slice(0, cfg.noiseCount);

  // Build noise array: each letter appears `noisePerLetter` times.
  const noiseChars: string[] = [];
  for (const l of noiseLetters) {
    for (let i = 0; i < cfg.noisePerLetter; i++) noiseChars.push(l);
  }
  const shuffledNoise = shuffle(noiseChars);

  // Distribute noise across the word, preserving word letter order.
  const total = wordChars.length + shuffledNoise.length;
  // Choose `wordChars.length` distinct slots out of total for word letters.
  const slotIdx = shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, wordChars.length).sort((a, b) => a - b);
  const targetSlots = new Set(slotIdx);

  const seq: Cell[] = new Array(total);
  let wi = 0;
  let ni = 0;
  for (let i = 0; i < total; i++) {
    if (targetSlots.has(i)) {
      seq[i] = { ch: wordChars[wi++], isTarget: true, struck: false };
    } else {
      seq[i] = { ch: shuffledNoise[ni++], isTarget: false, struck: false };
    }
  }
  return seq;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}м ${sec}с` : `${sec}с`;
}

export default function LetterStrikeout() {
  const [phase, setPhase] = useState<Phase>('settings');
  const [diff, setDiff] = useState<StrikeoutDifficulty>('easy');
  const [word, setWord] = useState('');
  const [cells, setCells] = useState<Cell[]>([]);
  const [errors, setErrors] = useState(0);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const savedRef = useRef(false);

  const cfg = DIFF[diff];

  const startGame = useCallback((d: StrikeoutDifficulty) => {
    const w = pickWord(d);
    setWord(w);
    setCells(buildSequence(w, d));
    setErrors(0);
    setShakeIdx(null);
    setElapsed(0);
    savedRef.current = false;
    setDiff(d);
    startRef.current = Date.now();
    setPhase('playing');
  }, []);

  // timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [phase]);

  const noiseRemaining = useMemo(
    () => cells.filter(c => !c.isTarget && !c.struck).length,
    [cells],
  );

  // finish detection
  useEffect(() => {
    if (phase !== 'playing') return;
    if (cells.length === 0) return;
    if (noiseRemaining === 0) {
      const secs = Math.round((Date.now() - startRef.current) / 1000);
      setElapsed(secs);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('letter-strikeout', 100, {
          difficulty: diff,
          word,
          wordLength: word.length,
          total: cells.length,
          errors,
          timeSec: secs,
        });
      }
      setTimeout(() => setPhase('result'), 600);
    }
  }, [noiseRemaining, phase, cells.length, diff, word, errors]);

  const handleClick = useCallback((idx: number) => {
    if (phase !== 'playing') return;
    const c = cells[idx];
    if (!c || c.struck) return;
    if (c.isTarget) {
      setErrors(e => e + 1);
      setShakeIdx(idx);
      setTimeout(() => setShakeIdx(s => (s === idx ? null : s)), 400);
      return;
    }
    setCells(prev => {
      const cur = prev[idx];
      if (!cur || cur.struck) return prev;
      const next = prev.slice();
      next[idx] = { ...cur, struck: true };
      return next;
    });
  }, [phase, cells]);

  // ---------- Settings ----------
  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">✂️</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Спрятанное слово</h2>
              <p className="text-xs text-gray-500">Вычеркните повторяющиеся буквы</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Перед вами строка букв. Некоторые встречаются по несколько раз — нажимайте
            на каждую такую букву, чтобы вычеркнуть её. Когда уберёте все повторы,
            оставшиеся буквы сложатся в слово.
          </p>
          <span className="text-gray-600 font-medium text-sm">Сложность</span>
          <div className="flex flex-col gap-3 mt-2 mb-6">
            {(Object.entries(DIFF) as [StrikeoutDifficulty, DiffCfg][]).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setDiff(key)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                  diff === key
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-violet-50'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-sm font-normal ${diff === key ? 'text-violet-100' : 'text-gray-400'}`}>{c.desc}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => startGame(diff)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  // ---------- Result ----------
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-5 py-6 animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Слово найдено!</h2>
          <p className="text-gray-400 text-sm mb-4">{cfg.label}</p>
          <div className="flex justify-center flex-wrap gap-1.5 mb-6">
            {word.split('').map((ch, i) => (
              <span
                key={i}
                className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-xl shadow-md"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Время</span>
              <span className="font-bold text-gray-800 text-lg">{fmtTime(elapsed)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Ошибок</span>
              <span className={`font-bold text-lg ${errors > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {errors}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('settings')}
            className="px-5 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95"
          >
            Настройки
          </button>
          <button
            onClick={() => startGame(diff)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
        </div>
      </div>
    );
  }

  // ---------- Playing ----------
  const totalNoise = cells.filter(c => !c.isTarget).length;
  const struck = totalNoise - noiseRemaining;

  return (
    <div className="flex flex-col gap-3 animate-fade-in pb-2">
      {/* HUD */}
      <div className="glass rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Вычеркнуто</div>
          <div className="font-bold text-gray-800 text-sm sm:text-base">{struck} / {totalNoise}</div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Ошибки</div>
          <div className={`font-bold text-sm sm:text-base ${errors > 0 ? 'text-red-500' : 'text-gray-300'}`}>{errors}</div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Время</div>
          <div className="font-bold text-gray-800 text-sm sm:text-base">{fmtTime(elapsed)}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
          style={{ width: totalNoise > 0 ? `${(struck / totalNoise) * 100}%` : '0%' }}
        />
      </div>

      {/* Hint */}
      <p className="text-center text-xs sm:text-sm text-gray-500">
        Нажмите на каждую <span className="font-semibold text-violet-600">повторяющуюся</span> букву —
        и узнаете спрятанное слово.
      </p>

      {/* Letter row */}
      <div className="glass rounded-2xl p-3 sm:p-5 shadow-sm">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          {cells.map((c, i) => {
            const struckClass = c.struck
              ? 'text-gray-300 bg-gray-50 cursor-default'
              : 'text-gray-800 bg-white/80 hover:bg-violet-50 hover:scale-110 cursor-pointer shadow-sm';
            const shakeClass = shakeIdx === i ? 'adverb-shake bg-rose-100 text-rose-600' : '';
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={c.struck}
                className={`relative w-9 h-11 sm:w-11 sm:h-14 md:w-12 md:h-14 rounded-lg flex items-center justify-center font-bold text-lg sm:text-2xl transition-all active:scale-95 ${struckClass} ${shakeClass}`}
              >
                <span className={c.struck ? 'line-through' : ''}>{c.ch}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
