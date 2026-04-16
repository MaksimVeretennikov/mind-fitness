import { useState, useCallback, useEffect, useRef } from 'react';
import { saveResult } from '../lib/auth';

const WORDS = [
  'кот', 'дом', 'лес', 'мир', 'сон', 'год', 'нос', 'рот', 'лоб', 'зуб',
  'куст', 'стол', 'окно', 'вода', 'небо', 'земля', 'цвет', 'друг', 'путь', 'ночь',
  'книга', 'школа', 'ветер', 'город', 'голос', 'камень', 'солнце', 'дерево',
];

const RUSSIAN_LETTERS = 'абвгдежзийклмнопрстуфхцчшщыьэюя';
const ROW_LEN = 40;

const TIME_OPTIONS = [
  { label: '1 мин', value: 60 },
  { label: '2 мин', value: 120 },
  { label: '3 мин', value: 180 },
  { label: '5 мин', value: 300 },
];
const WORD_COUNT_OPTIONS = [10, 15, 20, 25];

interface Settings {
  timeLimit: number;
  wordCount: number;
}

function generateText(words: string[], wordCount: number): { text: string; positions: Map<string, [number, number][]> } {
  const chosen = [...words].sort(() => Math.random() - 0.5).slice(0, wordCount);
  const rows = Math.max(10, Math.ceil(wordCount * 1.2));
  const totalLength = ROW_LEN * rows;
  const filler = Array.from({ length: totalLength }, () =>
    RUSSIAN_LETTERS[Math.floor(Math.random() * RUSSIAN_LETTERS.length)]
  );

  const positions = new Map<string, [number, number][]>();

  for (const word of chosen) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 300) {
      const pos = Math.floor(Math.random() * (totalLength - word.length));
      let ok = true;
      for (const ps of positions.values()) {
        for (const [s, e] of ps) {
          if (!(pos + word.length <= s || pos >= e)) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (ok) {
        for (let i = 0; i < word.length; i++) filler[pos + i] = word[i];
        positions.set(word, [[pos, pos + word.length]]);
        placed = true;
      }
      attempts++;
    }
  }

  return { text: filler.join(''), positions };
}

type Phase = 'settings' | 'playing' | 'result';

export default function Munsterberg() {
  const [phase, setPhase] = useState<Phase>('settings');
  const [settings, setSettings] = useState<Settings>({ timeLimit: 120, wordCount: 25 });
  const [gameKey, setGameKey] = useState(0);
  const [{ text, positions }, setData] = useState(() => generateText(WORDS, 25));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selStart, setSelStart] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  const startGame = useCallback((s: Settings) => {
    setData(generateText(WORDS, s.wordCount));
    setFound(new Set());
    setSelStart(null);
    setFlashResult(null);
    setTimeLeft(s.timeLimit);
    setPhase('playing');
    setGameKey(k => k + 1);
    savedRef.current = false;
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setPhase('result'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, gameKey]);

  const foundIndices = new Set<number>();
  for (const word of found) {
    const pos = positions.get(word);
    if (pos) {
      for (const [s, e] of pos) {
        for (let i = s; i < e; i++) foundIndices.add(i);
      }
    }
  }

  const handleClick = (idx: number) => {
    if (phase !== 'playing') return;
    if (foundIndices.has(idx)) return;
    if (selStart === null) {
      setSelStart(idx);
    } else {
      const lo = Math.min(selStart, idx);
      const hi = Math.max(selStart, idx);
      const selected = text.slice(lo, hi + 1);
      if (positions.has(selected) && !found.has(selected)) {
        setFound(prev => new Set([...prev, selected]));
        setFlashResult('correct');
      } else {
        setFlashResult('wrong');
      }
      setTimeout(() => setFlashResult(null), 600);
      setSelStart(null);
    }
  };

  const totalWords = positions.size;

  // Save result when time runs out
  useEffect(() => {
    if (phase === 'result' && !savedRef.current) {
      savedRef.current = true;
      const score = totalWords > 0 ? Math.round((found.size / totalWords) * 100) : 0;
      saveResult('munsterberg', score, {
        found: found.size,
        total: totalWords,
        timeLimit: settings.timeLimit,
        wordCount: settings.wordCount,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  const rows: string[] = [];
  for (let i = 0; i < text.length; i += ROW_LEN) {
    rows.push(text.slice(i, i + ROW_LEN));
  }

  if (phase === 'settings') {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Настройки теста</h2>

          <label className="block mb-5">
            <span className="text-gray-600 font-medium text-sm">Количество слов</span>
            <div className="flex gap-2 mt-2">
              {WORD_COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setSettings(s => ({ ...s, wordCount: n }))}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${settings.wordCount === n ? 'bg-violet-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-violet-50'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </label>

          <label className="block mb-6">
            <span className="text-gray-600 font-medium text-sm">Лимит времени</span>
            <div className="flex gap-2 mt-2">
              {TIME_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSettings(s => ({ ...s, timeLimit: value }))}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${settings.timeLimit === value ? 'bg-violet-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-violet-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <p className="text-gray-400 text-sm mb-5">
            В строке случайных букв спрятано <strong>{settings.wordCount}</strong> слов. Найдите их за <strong>{settings.timeLimit / 60} мин</strong>.
          </p>

          <button
            onClick={() => startGame(settings)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать тест
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 animate-scale-in">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800">Время вышло!</h2>
        <div className="glass rounded-2xl p-8 text-center shadow-lg max-w-sm w-full">
          <p className="text-gray-500 mb-2">Найдено слов</p>
          <p className="text-5xl font-bold text-violet-600 mb-1">{found.size}</p>
          <p className="text-gray-400 text-sm">из {totalWords}</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[...found].map(w => (
              <span key={w} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{w}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPhase('settings')} className="px-6 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95">
            Настройки
          </button>
          <button onClick={() => startGame(settings)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
            Новый тест
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 glass rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">Найдено:</span>
          <span className="font-bold text-violet-600 text-lg">{found.size}/{totalWords}</span>
        </div>
        <div className={`font-mono text-xl font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-gray-700'}`}>
          {mm}:{ss}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPhase('settings')} className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">
            Настройки
          </button>
          <button onClick={() => startGame(settings)} className="px-3 py-2 rounded-xl text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all active:scale-95">
            Новый тест
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-3 text-center">
        Кликните на первую букву слова, затем на последнюю
      </p>

      {flashResult && (
        <div className={`text-center text-sm font-semibold py-1 mb-2 rounded-lg animate-scale-in ${flashResult === 'correct' ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
          {flashResult === 'correct' ? '✓ Верно!' : '✗ Не найдено'}
        </div>
      )}

      {found.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[...found].map(w => (
            <span key={w} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-scale-in">{w}</span>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-5 shadow-sm select-none overflow-hidden">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-between" style={{ marginBottom: '2px' }}>
            {row.split('').map((ch, colIdx) => {
              const globalIdx = rowIdx * ROW_LEN + colIdx;
              const isFound = foundIndices.has(globalIdx);
              const isStart = globalIdx === selStart;
              return (
                <span
                  key={colIdx}
                  onClick={() => handleClick(globalIdx)}
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '1.25rem',
                    lineHeight: '2rem',
                    minWidth: '1.55rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    userSelect: 'none',
                    transition: 'background 0.1s',
                    background: isFound ? '#4ade80' : isStart ? '#a78bfa' : 'transparent',
                    color: isFound || isStart ? 'white' : '#374151',
                    fontWeight: isFound ? '600' : '400',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
