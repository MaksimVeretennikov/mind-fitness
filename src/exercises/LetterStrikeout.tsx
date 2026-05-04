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
  noiseCount: number; // distinct noise letters; each appears as a pair (×2)
}

const DIFF: Record<StrikeoutDifficulty, DiffCfg> = {
  easy:   { label: 'Лёгкая',  desc: '3–4 буквы · мало пар',  noiseCount: 6 },
  medium: { label: 'Средняя', desc: '5–6 букв · больше пар', noiseCount: 9 },
  hard:   { label: 'Трудная', desc: '7–8 букв · много пар',  noiseCount: 11 },
};

const ERROR_DELAY_MS = 700;
const MATCH_DELAY_MS = 280;

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

// Shuffle, then break adjacent same-character runs by swapping with a later cell.
function spreadOut(arr: string[]): string[] {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    if (a[i] !== a[i - 1]) continue;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] !== a[i] && a[j] !== a[i - 1]) {
        [a[i], a[j]] = [a[j], a[i]];
        break;
      }
    }
  }
  return a;
}

function buildSequence(word: string, diff: StrikeoutDifficulty): Cell[] {
  const cfg = DIFF[diff];
  const wordChars = word.split('');
  const wordSet = new Set(wordChars);

  const noisePool = shuffle(RU_ALPHABET.filter(l => !wordSet.has(l)));
  const noiseLetters = noisePool.slice(0, cfg.noiseCount);

  // Each noise letter appears as a pair.
  const noiseChars: string[] = [];
  for (const l of noiseLetters) { noiseChars.push(l, l); }
  const shuffledNoise = spreadOut(shuffle(noiseChars));

  const total = wordChars.length + shuffledNoise.length;
  const slotIdx = shuffle(Array.from({ length: total }, (_, i) => i))
    .slice(0, wordChars.length)
    .sort((a, b) => a - b);
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
  // Final passes: avoid any adjacent duplicates introduced by interleaving.
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let i = 1; i < seq.length; i++) {
      if (seq[i].ch !== seq[i - 1].ch) continue;
      const safe = (j: number) =>
        j !== i &&
        seq[j].ch !== seq[i].ch &&
        (j - 1 < 0 || seq[j - 1].ch !== seq[i].ch) &&
        (j + 1 >= seq.length || seq[j + 1].ch !== seq[i].ch);
      let swapped = false;
      for (let j = i + 2; j < seq.length; j++) {
        if (safe(j)) { [seq[i], seq[j]] = [seq[j], seq[i]]; swapped = true; break; }
      }
      if (!swapped) {
        for (let j = i - 2; j >= 0; j--) {
          if (safe(j)) { [seq[i], seq[j]] = [seq[j], seq[i]]; swapped = true; break; }
        }
      }
      if (swapped) changed = true;
    }
    if (!changed) break;
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [errorPair, setErrorPair] = useState<[number, number] | null>(null);
  const [matchPair, setMatchPair] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const savedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cfg = DIFF[diff];

  const startGame = useCallback((d: StrikeoutDifficulty) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const w = pickWord(d);
    setWord(w);
    setCells(buildSequence(w, d));
    setErrors(0);
    setSelectedIdx(null);
    setErrorPair(null);
    setMatchPair(null);
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

  // cleanup timers
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

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
      const t = setTimeout(() => setPhase('result'), 600);
      timersRef.current.push(t);
    }
  }, [noiseRemaining, phase, cells.length, diff, word, errors]);

  const handleClick = useCallback((idx: number) => {
    if (phase !== 'playing') return;
    if (errorPair || matchPair) return; // wait for animation
    const c = cells[idx];
    if (!c || c.struck) return;

    // First click — select.
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }

    // Same cell clicked again — deselect.
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }

    const a = cells[selectedIdx];
    const b = c;

    // Pair match: same character AND both are noise (target letters are unique).
    if (a.ch === b.ch && !a.isTarget && !b.isTarget) {
      const pair: [number, number] = [selectedIdx, idx];
      setMatchPair(pair);
      setSelectedIdx(null);
      const t = setTimeout(() => {
        setCells(prev => prev.map((cur, i) =>
          (i === pair[0] || i === pair[1]) ? { ...cur, struck: true } : cur,
        ));
        setMatchPair(null);
      }, MATCH_DELAY_MS);
      timersRef.current.push(t);
      return;
    }

    // Mismatch — flash both, count an error, then clear selection.
    const pair: [number, number] = [selectedIdx, idx];
    setErrorPair(pair);
    setErrors(e => e + 1);
    const t = setTimeout(() => {
      setErrorPair(null);
      setSelectedIdx(null);
    }, ERROR_DELAY_MS);
    timersRef.current.push(t);
  }, [phase, cells, selectedIdx, errorPair, matchPair]);

  // ---------- Settings ----------
  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">✂️</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Спрятанное слово</h2>
              <p className="text-xs text-gray-500">Найдите пары повторяющихся букв</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Перед вами строка букв. Каждая лишняя буква встречается ровно дважды.
            Нажмите на одну, затем на её пару — обе вычеркнутся. Когда уберёте все
            пары, оставшиеся буквы сложатся в слово.
          </p>
          <span className="text-gray-600 font-medium text-sm">Сложность</span>
          <div className="flex flex-col gap-3 mt-2 mb-6">
            {(Object.entries(DIFF) as [StrikeoutDifficulty, DiffCfg][]).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setDiff(key)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                  diff === key
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-rose-50'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-sm font-normal ${diff === key ? 'text-rose-100' : 'text-gray-400'}`}>{c.desc}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => startGame(diff)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
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
                className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white font-bold text-xl shadow-md"
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
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
          className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
          style={{ width: totalNoise > 0 ? `${(struck / totalNoise) * 100}%` : '0%' }}
        />
      </div>

      {/* Hint */}
      <p className="text-center text-xs sm:text-sm text-gray-500">
        Нажмите букву, затем найдите её <span className="font-semibold text-rose-600">пару</span>.
        Пары вычеркнутся. Уникальные буквы сложатся в слово.
      </p>

      {/* Letter row */}
      <div className="glass rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
          {cells.map((c, i) => {
            const isSelected = selectedIdx === i;
            const isErrorPair = errorPair && (errorPair[0] === i || errorPair[1] === i);
            const isMatchPair = matchPair && (matchPair[0] === i || matchPair[1] === i);

            let cls = 'text-gray-800 bg-white/80 hover:bg-amber-50 hover:scale-110 cursor-pointer shadow-sm';
            if (c.struck) cls = 'text-gray-300 bg-gray-50 cursor-default';
            else if (isMatchPair) cls = 'text-emerald-600 bg-emerald-100 ring-2 ring-emerald-400 scale-110';
            else if (isErrorPair) cls = 'text-rose-600 bg-rose-100 ring-2 ring-rose-400 adverb-shake';
            else if (isSelected) cls = 'text-amber-700 bg-amber-100 ring-2 ring-amber-400 scale-110 shadow-md';

            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={c.struck}
                className={`relative w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center font-bold text-lg sm:text-2xl transition-all active:scale-95 ${cls}`}
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
