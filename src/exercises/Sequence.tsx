import { useState, useEffect, useRef, useCallback } from 'react';
import { saveResult } from '../lib/auth';

const WORD_LIST = [
  'яблоко', 'дерево', 'облако', 'солнце', 'ветер',
  'камень', 'цветок', 'птица', 'река', 'гора',
  'звезда', 'луна', 'море', 'лес', 'огонь',
  'земля', 'небо', 'дождь', 'снег', 'лёд',
];

type Mode = 'numbers' | 'words';
type Phase = 'settings' | 'showing' | 'input' | 'result';

interface Settings {
  mode: Mode;
  count: number;
  displayInterval: number;
  pauseInterval: number;
}

function generateSequence(settings: Settings): (number | string)[] {
  if (settings.mode === 'numbers') {
    const set = new Set<number>();
    while (set.size < settings.count) {
      set.add(Math.floor(Math.random() * 99) + 1);
    }
    return [...set];
  } else {
    const shuffled = [...WORD_LIST].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, settings.count);
  }
}

export default function Sequence() {
  const [settings, setSettings] = useState<Settings>({
    mode: 'numbers',
    count: 7,
    displayInterval: 1500,
    pauseInterval: 500,
  });
  const [phase, setPhase] = useState<Phase>('settings');
  const [sequence, setSequence] = useState<(number | string)[]>([]);
  const [showIdx, setShowIdx] = useState<number>(-1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [score, setScore] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  const startGame = useCallback(() => {
    const seq = generateSequence(settings);
    setSequence(seq);
    setShowIdx(-1);
    setAnswers([]);
    setInputVal('');
    setScore(0);
    setPhase('showing');
    savedRef.current = false;
  }, [settings]);

  // Sequence display logic
  useEffect(() => {
    if (phase !== 'showing') return;

    const step = (idx: number) => {
      if (idx >= sequence.length) {
        // Done showing
        setShowIdx(-1);
        setPhase('input');
        return;
      }
      // Pause first
      timeoutRef.current = setTimeout(() => {
        setShowIdx(idx);
        // Show for displayInterval, then hide & move on
        timeoutRef.current = setTimeout(() => {
          setShowIdx(-1);
          step(idx + 1);
        }, settings.displayInterval);
      }, settings.pauseInterval);
    };

    // Start
    step(0);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase, sequence, settings.displayInterval, settings.pauseInterval]);

  const submitAnswer = () => {
    if (answers.length >= sequence.length) return;
    const newAnswers = [...answers, inputVal.trim()];
    setAnswers(newAnswers);
    setInputVal('');
    if (newAnswers.length === sequence.length) {
      const correct = newAnswers.filter((a, i) => a.toString() === sequence[i].toString()).length;
      const pct = Math.round((correct / sequence.length) * 100);
      setScore(correct);
      setPhase('result');
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('sequence', pct, {
          correct,
          total: sequence.length,
          mode: settings.mode,
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitAnswer();
  };

  const pct = Math.round((score / sequence.length) * 100);

  if (phase === 'settings') {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Настройки упражнения</h2>

          <label className="block mb-4">
            <span className="text-gray-600 font-medium text-sm">Режим</span>
            <div className="flex gap-3 mt-2">
              {(['numbers', 'words'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setSettings(s => ({ ...s, mode: m }))}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${settings.mode === m ? 'bg-pink-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-pink-50'}`}
                >
                  {m === 'numbers' ? 'Числа' : 'Слова'}
                </button>
              ))}
            </div>
          </label>

          <label className="block mb-4">
            <span className="text-gray-600 font-medium text-sm">Количество элементов: <strong className="text-pink-600">{settings.count}</strong></span>
            <input type="range" min={3} max={15} value={settings.count}
              onChange={e => setSettings(s => ({ ...s, count: +e.target.value }))}
              className="w-full mt-2 accent-pink-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>3</span><span>15</span></div>
          </label>

          <label className="block mb-4">
            <span className="text-gray-600 font-medium text-sm">Время показа: <strong className="text-pink-600">{(settings.displayInterval / 1000).toFixed(1)} с</strong></span>
            <input type="range" min={500} max={3000} step={100} value={settings.displayInterval}
              onChange={e => setSettings(s => ({ ...s, displayInterval: +e.target.value }))}
              className="w-full mt-2 accent-pink-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0.5 с</span><span>3 с</span></div>
          </label>

          <label className="block mb-5">
            <span className="text-gray-600 font-medium text-sm">Пауза между элементами: <strong className="text-pink-600">{(settings.pauseInterval / 1000).toFixed(1)} с</strong></span>
            <input type="range" min={0} max={2000} step={100} value={settings.pauseInterval}
              onChange={e => setSettings(s => ({ ...s, pauseInterval: +e.target.value }))}
              className="w-full mt-2 accent-pink-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0 с</span><span>2 с</span></div>
          </label>

          <button onClick={startGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'showing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-80 animate-fade-in">
        <p className="text-gray-400 mb-8 text-sm">Запомните последовательность</p>
        <div className="w-64 h-40 glass rounded-2xl flex items-center justify-center shadow-lg">
          {showIdx >= 0 ? (
            <span key={showIdx} className="text-5xl font-bold text-gray-800 animate-scale-in">
              {sequence[showIdx]}
            </span>
          ) : (
            <span className="text-gray-300 text-lg">…</span>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-6">
          {showIdx >= 0 ? `${showIdx + 1} / ${sequence.length}` : 'Пауза'}
        </p>
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Введите элементы по порядку</h2>
          <p className="text-gray-500 text-sm mb-5">Введено: {answers.length} / {sequence.length}</p>

          {/* Answers so far */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-10">
            {answers.map((a, i) => (
              <span key={i} className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium animate-scale-in">
                {a}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Элемент ${answers.length + 1}`}
              className="flex-1 px-4 py-3 rounded-xl glass border border-pink-200 focus:border-pink-400 outline-none text-gray-700 text-lg"
            />
            <button onClick={submitAnswer} disabled={!inputVal.trim()}
              className="px-6 py-3 rounded-xl bg-pink-500 text-white font-semibold disabled:opacity-40 hover:bg-pink-600 transition-all active:scale-95">
              →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result
  return (
    <div className="max-w-lg mx-auto animate-scale-in">
      <div className="glass rounded-2xl p-6 shadow-sm mb-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold text-gray-800">{pct >= 80 ? 'Отлично!' : pct >= 50 ? 'Неплохо!' : 'Тренируйтесь!'}</h2>
          <p className="text-4xl font-bold text-pink-600 mt-2">{score}/{sequence.length}</p>
          <p className="text-gray-400 text-sm">{pct}% верных ответов</p>
        </div>

        <div className="space-y-2">
          {sequence.map((item, i) => {
            const correct = answers[i]?.toString() === item.toString();
            return (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${correct ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className="text-gray-500 text-sm">{i + 1}.</span>
                <span className="font-semibold text-gray-700">{item}</span>
                <span className={`text-sm font-medium ${correct ? 'text-green-600' : 'text-red-500'}`}>
                  {correct ? '✓' : `✗ (вы: ${answers[i] || '—'})`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setPhase('settings')} className="flex-1 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95">
          Настройки
        </button>
        <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
          Ещё раз
        </button>
      </div>
    </div>
  );
}
