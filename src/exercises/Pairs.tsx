import { useState, useCallback, useEffect, useRef } from 'react';
import { saveResult } from '../lib/auth';

const SYMBOLS_4x4 = ['🌟', '🎯', '🎨', '🚀', '🌈', '🎸', '🦋', '🔮'];
const SYMBOLS_6x6 = ['🌟', '🎯', '🎨', '🚀', '🌈', '🎸', '🦋', '🔮', '🎭', '🌊', '🦁', '🎺', '🌺', '🎲', '🍀', '🎠', '🦄', '🌙'];

type GridSize = '4x4' | '6x6';
type Phase = 'settings' | 'memorize' | 'playing' | 'result';

interface Card {
  id: number;
  symbol: string;
  pairId: number;
}

function buildCards(size: GridSize): Card[] {
  const symbols = size === '4x4' ? SYMBOLS_4x4 : SYMBOLS_6x6;
  return [...symbols, ...symbols]
    .map((symbol, i) => ({ id: i, symbol, pairId: i % symbols.length }))
    .sort(() => Math.random() - 0.5);
}

export default function Pairs() {
  const [gridSize, setGridSize] = useState<GridSize>('4x4');
  const [memorizeTime, setMemorizeTime] = useState(5);
  const [phase, setPhase] = useState<Phase>('settings');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [memorizeLeft, setMemorizeLeft] = useState(memorizeTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blockRef = useRef(false);
  const savedRef = useRef(false);

  const startGame = useCallback((size: GridSize, memTime: number) => {
    const newCards = buildCards(size);
    setCards(newCards);
    setFlipped(new Set(newCards.map(c => c.id)));
    setMatched(new Set());
    setSelected([]);
    setAttempts(0);
    setElapsed(0);
    setMemorizeLeft(memTime);
    setPhase('memorize');
    blockRef.current = false;
    savedRef.current = false;
  }, []);

  // Save result when all pairs found
  useEffect(() => {
    if (phase === 'result' && !savedRef.current) {
      savedRef.current = true;
      const pairs = cards.length / 2;
      const efficiency = Math.max(0, Math.round(100 - Math.max(0, attempts - pairs) * 3));
      saveResult('pairs', efficiency, {
        elapsed,
        attempts,
        pairs,
        gridSize,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    timerRef.current = setInterval(() => {
      setMemorizeLeft(t => {
        if (t <= 1) { setPhase('playing'); setFlipped(new Set()); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleCardClick = (cardId: number) => {
    if (phase !== 'playing' || blockRef.current || matched.has(cardId) || flipped.has(cardId)) return;
    if (selected.length === 1 && selected[0] === cardId) return;

    const newFlipped = new Set(flipped);
    newFlipped.add(cardId);
    setFlipped(newFlipped);

    if (selected.length === 0) {
      setSelected([cardId]);
    } else {
      const firstId = selected[0];
      const first = cards.find(c => c.id === firstId)!;
      const second = cards.find(c => c.id === cardId)!;
      setAttempts(a => a + 1);
      if (first.pairId === second.pairId) {
        const newMatched = new Set(matched);
        newMatched.add(firstId); newMatched.add(cardId);
        setMatched(newMatched);
        setSelected([]);
        if (newMatched.size === cards.length) {
          setPhase('result');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } else {
        blockRef.current = true;
        setSelected([]);
        setTimeout(() => {
          setFlipped(prev => { const n = new Set(prev); n.delete(firstId); n.delete(cardId); return n; });
          blockRef.current = false;
        }, 900);
      }
    }
  };

  const cols = gridSize === '4x4' ? 4 : 6;
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Настройки</h2>
          <label className="block mb-5">
            <span className="text-gray-600 font-medium text-sm">Размер поля</span>
            <div className="flex gap-3 mt-2">
              {(['4x4', '6x6'] as GridSize[]).map(s => (
                <button key={s} onClick={() => setGridSize(s)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${gridSize === s ? 'bg-emerald-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-emerald-50'}`}>
                  {s} ({s === '4x4' ? '8 пар' : '18 пар'})
                </button>
              ))}
            </div>
          </label>
          <label className="block mb-6">
            <span className="text-gray-600 font-medium text-sm">
              Время запоминания: <strong className="text-emerald-600">{memorizeTime} сек</strong>
            </span>
            <input type="range" min={3} max={30} step={1} value={memorizeTime}
              onChange={e => setMemorizeTime(+e.target.value)}
              className="w-full mt-2 accent-emerald-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>3 сек</span><span>30 сек</span></div>
          </label>
          <p className="text-gray-400 text-sm mb-5">
            Карточки показываются {memorizeTime} сек, затем переворачиваются. Найдите все пары!
          </p>
          <button onClick={() => startGame(gridSize, memorizeTime)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800">Все пары найдены!</h2>
        <div className="glass rounded-2xl p-6 text-center shadow-lg w-64">
          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Время:</span>
            <span className="font-bold text-gray-800">{formatTime(elapsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Попыток:</span>
            <span className="font-bold text-emerald-600">{attempts}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPhase('settings')} className="px-6 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95">Настройки</button>
          <button onClick={() => startGame(gridSize, memorizeTime)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">Играть снова</button>
        </div>
      </div>
    );
  }

  // Calculate card size to fill screen height
  // playing or memorize phase
  return (
    <div className="animate-fade-in flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 90px)' }}>
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-3 shadow-sm flex-shrink-0">
        <div>
          <span className="text-gray-500 text-sm">Пар: </span>
          <span className="font-bold text-emerald-600">{matched.size / 2}/{cards.length / 2}</span>
        </div>
        <div className={`font-semibold text-sm px-3 py-1 rounded-full ${phase === 'memorize' ? 'bg-yellow-100 text-yellow-700' : 'bg-white/70 text-gray-700'}`}>
          {phase === 'memorize' ? `Запоминайте… ${memorizeLeft}с` : formatTime(elapsed)}
        </div>
        <div>
          <span className="text-gray-500 text-sm">Попыток: </span>
          <span className="font-bold text-gray-700">{attempts}</span>
        </div>
      </div>

      {/* Card grid — fills remaining height */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="grid gap-3 w-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: cols === 4 ? '520px' : '720px',
          }}
        >
          {cards.map(card => {
            const isFlipped = flipped.has(card.id) || matched.has(card.id);
            const isMatched = matched.has(card.id);
            return (
              <div
                key={card.id}
                className="card-3d cursor-pointer"
                style={{ aspectRatio: '1' }}
                onClick={() => handleCardClick(card.id)}
              >
                <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
                  <div className={`card-face ${isMatched ? 'bg-green-100' : 'bg-gradient-to-br from-emerald-400 to-teal-500'} shadow-sm`}>
                    <span className="text-white text-3xl font-bold opacity-50">?</span>
                  </div>
                  <div className={`card-face card-back ${isMatched ? 'bg-green-50 border-2 border-green-300' : 'bg-white/90'} shadow-sm`}>
                    <span style={{ fontSize: cols === 6 ? '1.8rem' : '2.5rem' }}>{card.symbol}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
