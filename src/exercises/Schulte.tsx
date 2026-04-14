import { useState, useEffect, useRef, useCallback } from 'react';
import { saveResult } from '../lib/auth';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newGame() {
  const pool = Array.from({ length: 60 }, (_, i) => i + 1);
  const picked = shuffle(pool).slice(0, 25);
  const sorted = [...picked].sort((a, b) => a - b);
  const left = shuffle(picked);
  return { left, sorted, right: Array(25).fill(null) as (number | null)[] };
}

export default function Schulte() {
  const [game, setGame] = useState(newGame);
  const { left, sorted, right } = game;
  const [nextRank, setNextRank] = useState(0);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  const startNew = useCallback(() => {
    setGame(newGame());
    setNextRank(0);
    setWrongIdx(null);
    setWrongClicks(0);
    setStarted(false);
    setElapsed(0);
    setFinished(false);
    savedRef.current = false;
  }, []);

  // Save result on finish
  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      saveResult('schulte', 100, { elapsed, count: sorted.length, errors: wrongClicks });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished]);

  const handleClick = (val: number, gridIdx: number) => {
    if (finished) return;
    if (!started) setStarted(true);

    const alreadyPlaced = right.includes(val);
    if (alreadyPlaced) return;

    if (val === sorted[nextRank]) {
      const newRight = [...right];
      newRight[nextRank] = val;
      const newRank = nextRank + 1;
      setGame(g => ({ ...g, right: newRight }));
      setNextRank(newRank);
      setWrongIdx(null);
      if (newRank >= sorted.length) {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } else {
      setWrongIdx(gridIdx);
      setWrongClicks(c => c + 1);
      setTimeout(() => setWrongIdx(null), 400);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}м ${s % 60}с` : `${s}с`;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 glass rounded-2xl px-5 py-3 shadow-sm">
        <div className="font-mono text-xl font-bold text-gray-700">{formatTime(elapsed)}</div>
        <span className="text-gray-500 text-sm">{nextRank}/{sorted.length} чисел</span>
        <div className="flex items-center gap-3">
          {wrongClicks > 0 && (
            <span className="text-red-500 text-sm font-semibold">
              {wrongClicks} {wrongClicks % 10 === 1 && wrongClicks % 100 !== 11 ? 'ошибка' : [2,3,4].includes(wrongClicks % 10) && ![12,13,14].includes(wrongClicks % 100) ? 'ошибки' : 'ошибок'}
            </span>
          )}
          <button onClick={startNew} className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95">
            Новая игра
          </button>
        </div>
      </div>

      {!started && (
        <p className="text-center text-gray-500 text-sm mb-4">
          Кликайте числа из левой таблицы по возрастанию — они появятся справа.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-start">
        {/* Left grid — all numbers always look identical, no highlighting */}
        <div className="flex-1">
          <p className="text-center font-semibold text-gray-600 mb-2">Числа</p>
          <div className="grid grid-cols-5 gap-2">
            {left.map((num, i) => {
              const isWrong = wrongIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => handleClick(num, i)}
                  className={`h-14 text-base font-bold rounded-xl transition-all select-none
                    ${isWrong
                      ? 'bg-red-100 text-red-600'
                      : 'bg-white/80 text-gray-700 hover:bg-indigo-100 cursor-pointer'
                    }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right grid — fills up in ascending order */}
        <div className="flex-1">
          <p className="text-center font-semibold text-gray-600 mb-2">По возрастанию</p>
          <div className="grid grid-cols-5 gap-2">
            {right.map((num, i) => (
              <div
                key={i}
                className={`h-14 rounded-xl flex items-center justify-center text-base font-bold transition-all
                  ${num !== null
                    ? 'bg-indigo-100 text-indigo-700 animate-scale-in'
                    : 'bg-white/30 border border-gray-100'
                  }`}
              >
                {num !== null ? num : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {finished && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass rounded-3xl p-10 text-center shadow-2xl animate-scale-in max-w-sm mx-4">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Завершено!</h2>
            <div className="flex justify-between gap-6 mb-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Время</p>
                <p className="text-3xl font-bold text-indigo-600">{formatTime(elapsed)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Ошибки</p>
                <p className={`text-3xl font-bold ${wrongClicks === 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {wrongClicks}
                </p>
              </div>
            </div>
            <button onClick={startNew} className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
              Новая игра
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
