import { useState, useEffect, useRef, useCallback } from 'react';
import { saveResult } from '../lib/auth';

const SYMBOL_SETS = [
  { plus: '▲', minus: '■' },
  { plus: '●', minus: '◆' },
  { plus: '▼', minus: '▶' },
  { plus: '◆', minus: '▲' },
  { plus: '■', minus: '●' },
  { plus: '▶', minus: '▼' },
];

type Phase = 'idle' | 'memorize' | 'playing' | 'result';

interface Problem {
  display: string;
  answer: number;
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateProblems(sym: typeof SYMBOL_SETS[0]): Problem[] {
  const problems: Problem[] = [];
  while (problems.length < 15) {
    const a = randInt(1, 9), b = randInt(1, 9), c = randInt(1, 9);
    const op1 = Math.random() < 0.5 ? '+' : '-';
    const op2 = Math.random() < 0.5 ? '+' : '-';
    const answer = a + (op1 === '+' ? b : -b) + (op2 === '+' ? c : -c);
    if (answer < 0) continue;
    const s1 = op1 === '+' ? sym.plus : sym.minus;
    const s2 = op2 === '+' ? sym.plus : sym.minus;
    problems.push({ display: `${a} ${s1} ${b} ${s2} ${c}`, answer });
  }
  return problems;
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SmartCount() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [symbolIdx] = useState(() => Math.floor(Math.random() * SYMBOL_SETS.length));
  const symbolSet = SYMBOL_SETS[symbolIdx];
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [results, setResults] = useState<boolean[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);

  const startGame = useCallback(() => {
    setProblems(generateProblems(symbolSet));
    setCurrentIdx(0);
    setResults([]);
    setInputVal('');
    setTotalTime(0);
    setElapsed(0);
    setCountdown(5);
    setPhase('memorize');
  }, [symbolSet]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    if (countdown <= 0) {
      startTimeRef.current = Date.now();
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [phase, currentIdx]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputVal.trim();
    if (trimmed === '') return;
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) return;

    const correct = parsed === problems[currentIdx]?.answer;
    const newResults = [...results, correct];
    setResults(newResults);

    setInputVal('');
    const nextIdx = currentIdx + 1;

    const advance = () => {
      if (nextIdx >= 15) {
        const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
        setTotalTime(secs);
        const finalErrors = newResults.filter(r => !r).length;
        const scorePct = Math.round(((15 - finalErrors) / 15) * 100);
        saveResult('smart-count', scorePct, {
          total: 15,
          correct: 15 - finalErrors,
          errors: finalErrors,
          timeSec: secs,
        });
        setPhase('result');
      } else {
        setCurrentIdx(nextIdx);
      }
    };

    if (correct) {
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); advance(); }, 300);
    } else {
      setShowError(true);
      setTimeout(() => { setShowError(false); advance(); }, 600);
    }
  }, [inputVal, problems, currentIdx, results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const errorsCount = results.filter(r => !r).length;

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
        <div className="glass rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">🧮</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Умный счёт</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Запомните, какой символ заменяет «плюс», а какой — «минус».
            На запоминание — 5 секунд, затем 15 примеров на время.
          </p>
          <div className="flex justify-center gap-10 mb-6 p-4 rounded-xl bg-white/60">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center text-4xl font-bold leading-none">{symbolSet.plus}</div>
              <div className="text-sm text-gray-500 font-medium">= плюс</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center text-4xl font-bold leading-none">{symbolSet.minus}</div>
              <div className="text-sm text-gray-500 font-medium">= минус</div>
            </div>
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'memorize') {
    const dashPct = (countdown / 5) * 100;
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
        <div className="glass rounded-2xl p-8 text-center shadow-sm max-w-sm w-full">
          <p className="text-sm text-gray-500 mb-6 font-medium">Запомните замену символов!</p>
          <div className="flex justify-center gap-14 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center text-6xl leading-none">{symbolSet.plus}</div>
              <div className="text-lg text-gray-500">= <span className="font-bold text-gray-800 text-xl">+</span></div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center text-6xl leading-none">{symbolSet.minus}</div>
              <div className="text-lg text-gray-500">= <span className="font-bold text-gray-800 text-xl">−</span></div>
            </div>
          </div>
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#6366f1" strokeWidth="3"
                strokeDasharray={`${dashPct} 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.9s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-indigo-600">
              {countdown}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const finalErrors = results.filter(r => !r).length;
    const correct = 15 - finalErrors;
    const accuracy = Math.round((correct / 15) * 100);
    return (
      <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-3">🧮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Готово!</h2>
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Общее время</span>
              <span className="font-bold text-gray-800 text-lg">{fmtTime(totalTime)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Верных ответов</span>
              <span className="font-bold text-emerald-600 text-lg">{correct} / 15</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Ошибок</span>
              <span className={`font-bold text-lg ${finalErrors > 0 ? 'text-red-500' : 'text-gray-400'}`}>{finalErrors}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Точность</span>
              <span className={`font-bold text-lg ${accuracy >= 90 ? 'text-emerald-600' : accuracy >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {accuracy}%
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
        >
          Играть снова
        </button>
      </div>
    );
  }

  // Playing phase
  const problem = problems[currentIdx];
  const progressPct = (currentIdx / 15) * 100;

  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in max-w-lg mx-auto w-full">
      {/* HUD */}
      <div className="glass rounded-2xl px-5 py-3 w-full flex items-center justify-between shadow-sm">
        <div className="text-center min-w-[60px]">
          <div className="text-xs text-gray-400 mb-0.5">Пример</div>
          <div className="font-bold text-gray-800 text-lg">{currentIdx + 1} / 15</div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-xs text-gray-400 mb-0.5">Ошибки</div>
          <div className={`font-bold text-lg ${errorsCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
            {errorsCount}
          </div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-xs text-gray-400 mb-0.5">Время</div>
          <div className="font-bold text-gray-800 text-lg">{fmtTime(elapsed)}</div>
        </div>
      </div>

      {/* Problem card */}
      <div
        className="glass rounded-2xl py-10 px-6 text-center shadow-sm w-full transition-colors duration-300"
        style={{
          backgroundColor: showError
            ? 'rgba(254, 226, 226, 0.7)'
            : showSuccess
            ? 'rgba(209, 250, 229, 0.7)'
            : undefined,
        }}
      >
        <div className="text-5xl sm:text-6xl font-bold text-gray-800 tracking-wider leading-tight">
          {problem?.display} =
        </div>
        <div className="text-xs text-gray-400 mt-4">Введите ответ и нажмите Enter</div>
      </div>

      {/* Input + submit */}
      <div className="flex gap-3 w-full">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputVal}
          onChange={e => setInputVal(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 text-center text-4xl font-bold rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none py-4 bg-white/80 shadow-sm transition-colors"
          placeholder="?"
          autoComplete="off"
        />
        <button
          onClick={handleSubmit}
          className="px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-2xl font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
        >
          →
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
