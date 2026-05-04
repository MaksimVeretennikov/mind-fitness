import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { JSX } from 'react';
import { saveResult } from '../lib/auth';

type Difficulty = 'small' | 'medium' | 'large';

interface DiffCfg {
  label: string;
  desc: string;
  n: number;
  cols: number;
  rows: number;
}

const DIFF: Record<Difficulty, DiffCfg> = {
  small:  { label: 'Маленькая', desc: '3 фигуры · 18 ячеек', n: 3, cols: 6, rows: 3 },
  medium: { label: 'Средняя',   desc: '4 фигуры · 24 ячейки', n: 4, cols: 6, rows: 4 },
  large:  { label: 'Большая',   desc: '5 фигур · 30 ячеек',    n: 5, cols: 6, rows: 5 },
};

const MEMORIZE_MS = 5000;
const FEEDBACK_MS = 380;

// --- Shapes ---
type ShapeId =
  | 'moon' | 'star' | 'flag' | 'cloud' | 'leaf'
  | 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'shield';

interface ShapeDef { id: ShapeId; d: string; cx: number; cy: number }

const SHAPES: ShapeDef[] = [
  { id: 'moon',    d: 'M 56 8 A 32 32 0 1 0 56 72 A 24 24 0 1 1 56 8 Z',                       cx: 50, cy: 40 },
  { id: 'star',    d: 'M 40 7 L 49 31 L 75 31 L 54 47 L 62 73 L 40 56 L 18 73 L 26 47 L 5 31 L 31 31 Z', cx: 40, cy: 44 },
  { id: 'flag',    d: 'M 14 8 L 14 74 M 14 8 L 66 8 L 56 22 L 66 36 L 14 36',                  cx: 36, cy: 22 },
  { id: 'cloud',   d: 'M 18 56 Q 4 56 8 42 Q 6 26 24 28 Q 30 12 50 18 Q 70 14 70 34 Q 80 40 70 56 Z', cx: 38, cy: 40 },
  { id: 'leaf',    d: 'M 14 70 Q 6 22 60 12 Q 76 58 14 70 Z',                                  cx: 38, cy: 42 },
  { id: 'circle',  d: 'M 40 8 A 32 32 0 1 1 40 72 A 32 32 0 1 1 40 8 Z',                       cx: 40, cy: 40 },
  { id: 'diamond', d: 'M 40 6 L 74 40 L 40 74 L 6 40 Z',                                       cx: 40, cy: 40 },
  { id: 'hexagon', d: 'M 14 40 L 28 13 L 56 13 L 70 40 L 56 67 L 28 67 Z',                     cx: 40, cy: 40 },
  { id: 'triangle',d: 'M 40 8 L 74 70 L 6 70 Z',                                               cx: 40, cy: 50 },
  { id: 'shield',  d: 'M 12 12 Q 12 8 16 8 L 64 8 Q 68 8 68 12 L 68 40 Q 68 60 40 74 Q 12 60 12 40 Z', cx: 40, cy: 38 },
];

// --- Symbols ---
type SymbolId =
  | 'check' | 'cross' | 'dot' | 'ring' | 'bar' | 'plus'
  | 'wave' | 'tri' | 'sq' | 'arrow' | 'bang' | 'asterisk';

function renderSymbol(id: SymbolId, cx: number, cy: number, color: string): JSX.Element {
  switch (id) {
    case 'check':
      return (
        <path d={`M ${cx-8} ${cy} L ${cx-2} ${cy+6} L ${cx+8} ${cy-7}`}
          stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      );
    case 'cross':
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
          <line x1={cx-7} y1={cy-7} x2={cx+7} y2={cy+7} />
          <line x1={cx-7} y1={cy+7} x2={cx+7} y2={cy-7} />
        </g>
      );
    case 'dot':
      return <circle cx={cx} cy={cy} r="4.5" fill={color} />;
    case 'ring':
      return <circle cx={cx} cy={cy} r="7" stroke={color} strokeWidth="2.5" fill="none" />;
    case 'bar':
      return <line x1={cx-9} y1={cy} x2={cx+9} y2={cy} stroke={color} strokeWidth="3" strokeLinecap="round" />;
    case 'plus':
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
          <line x1={cx} y1={cy-8} x2={cx} y2={cy+8} />
          <line x1={cx-8} y1={cy} x2={cx+8} y2={cy} />
        </g>
      );
    case 'wave':
      return (
        <path d={`M ${cx-10} ${cy} Q ${cx-5} ${cy-7} ${cx} ${cy} T ${cx+10} ${cy}`}
          stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      );
    case 'tri':
      return (
        <path d={`M ${cx} ${cy-7} L ${cx+7} ${cy+5} L ${cx-7} ${cy+5} Z`}
          stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      );
    case 'sq':
      return <rect x={cx-6} y={cy-6} width="12" height="12" stroke={color} strokeWidth="2.5" fill="none" />;
    case 'arrow':
      return (
        <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1={cx-8} y1={cy} x2={cx+8} y2={cy} />
          <polyline points={`${cx+3},${cy-4} ${cx+8},${cy} ${cx+3},${cy+4}`} />
        </g>
      );
    case 'bang':
      return (
        <g fill={color}>
          <rect x={cx-1.5} y={cy-9} width="3" height="11" rx="1.2" />
          <circle cx={cx} cy={cy+6} r="2" />
        </g>
      );
    case 'asterisk':
      return (
        <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
          <line x1={cx} y1={cy-7} x2={cx} y2={cy+7} />
          <line x1={cx-6} y1={cy-4} x2={cx+6} y2={cy+4} />
          <line x1={cx-6} y1={cy+4} x2={cx+6} y2={cy-4} />
        </g>
      );
  }
}

const ALL_SYMBOLS: SymbolId[] = ['check', 'cross', 'dot', 'ring', 'bar', 'plus', 'wave', 'tri', 'sq', 'arrow', 'bang', 'asterisk'];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildGrid(shapeIds: ShapeId[], cellCount: number): ShapeId[] {
  // Distribute shapes roughly equally across all cells, then shuffle.
  const cells: ShapeId[] = [];
  for (let i = 0; i < cellCount; i++) cells.push(shapeIds[i % shapeIds.length]);
  return shuffle(cells);
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}м ${sec}с` : `${sec}с`;
}

function pluralSec(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'секунду';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'секунды';
  return 'секунд';
}

interface Game {
  shapeIds: ShapeId[];
  mapping: Record<string, SymbolId>; // shapeId -> symbol
  symbols: SymbolId[]; // ordered for the answer panel
  cells: ShapeId[];
}

function makeGame(diff: Difficulty): Game {
  const cfg = DIFF[diff];
  const shapeIds = shuffle(SHAPES.map(s => s.id)).slice(0, cfg.n);
  const symbols = shuffle(ALL_SYMBOLS).slice(0, cfg.n);
  const mapping: Record<string, SymbolId> = {};
  shapeIds.forEach((sid, i) => { mapping[sid] = symbols[i]; });
  const cells = buildGrid(shapeIds, cfg.cols * cfg.rows);
  return { shapeIds, mapping, symbols, cells };
}

type Phase = 'settings' | 'memorize' | 'solving' | 'result';

interface Filled { sym: SymbolId; correct: boolean }

function ShapeIcon({ id, symbol, size, color = '#1e293b', symColor = '#1e293b', fill = false }: {
  id: ShapeId;
  symbol?: SymbolId;
  size?: number;
  color?: string;
  symColor?: string;
  fill?: boolean;
}) {
  const def = SHAPES.find(s => s.id === id)!;
  const sizeProps = fill
    ? { width: '88%', height: '88%' }
    : { width: size, height: size };
  return (
    <svg viewBox="0 0 80 80" {...sizeProps}>
      <path d={def.d} stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {symbol && renderSymbol(symbol, def.cx, def.cy, symColor)}
    </svg>
  );
}

function SymbolIcon({ id, size = 36, color = '#1e293b' }: { id: SymbolId; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {renderSymbol(id, 20, 20, color)}
    </svg>
  );
}

export default function MemoryCipher() {
  const [phase, setPhase] = useState<Phase>('settings');
  const [diff, setDiff] = useState<Difficulty>('small');
  const [game, setGame] = useState<Game | null>(null);
  const [filled, setFilled] = useState<(Filled | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [errors, setErrors] = useState(0);
  const [memorizeLeft, setMemorizeLeft] = useState(MEMORIZE_MS / 1000);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedbackForIdx, setFeedbackForIdx] = useState<number | null>(null);
  const savedRef = useRef(false);

  const cfg = DIFF[diff];

  const startGame = useCallback((d: Difficulty) => {
    const g = makeGame(d);
    setGame(g);
    setFilled(new Array(g.cells.length).fill(null));
    setActiveIdx(0);
    setErrors(0);
    setElapsed(0);
    setMemorizeLeft(Math.ceil(MEMORIZE_MS / 1000));
    setFeedbackForIdx(null);
    savedRef.current = false;
    setDiff(d);
    setPhase('memorize');
  }, []);

  // memorize countdown -> solving
  useEffect(() => {
    if (phase !== 'memorize') return;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((MEMORIZE_MS - (Date.now() - startedAt)) / 1000));
      setMemorizeLeft(left);
    }, 200);
    const t = setTimeout(() => {
      startRef.current = Date.now();
      setPhase('solving');
    }, MEMORIZE_MS);
    return () => { clearTimeout(t); clearInterval(tick); };
  }, [phase]);

  // solving timer
  useEffect(() => {
    if (phase !== 'solving') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  const finishGame = useCallback((finalErrors: number, finalFilled: (Filled | null)[]) => {
    const secs = Math.round((Date.now() - startRef.current) / 1000);
    setElapsed(secs);
    if (savedRef.current) return;
    savedRef.current = true;
    const total = finalFilled.length;
    const correct = finalFilled.filter(f => f?.correct).length;
    saveResult('memory-cipher', total > 0 ? Math.round((correct / total) * 100) : 0, {
      difficulty: diff,
      shapesCount: cfg.n,
      total,
      correct,
      errors: finalErrors,
      timeSec: secs,
    });
    setPhase('result');
  }, [diff, cfg.n]);

  const handleSymbolClick = useCallback((sym: SymbolId) => {
    if (phase !== 'solving' || !game) return;
    if (feedbackForIdx !== null) return; // wait for feedback
    if (activeIdx >= game.cells.length) return;
    if (filled[activeIdx]) return;

    const shape = game.cells[activeIdx];
    const correctSym = game.mapping[shape];
    const isCorrect = sym === correctSym;
    const newFilled = [...filled];
    newFilled[activeIdx] = { sym, correct: isCorrect };
    setFilled(newFilled);
    if (!isCorrect) setErrors(e => e + 1);
    setFeedbackForIdx(activeIdx);

    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    feedbackRef.current = setTimeout(() => {
      setFeedbackForIdx(null);
      // find next unfilled cell starting from activeIdx + 1, then wrap
      let nextIdx = -1;
      for (let i = activeIdx + 1; i < newFilled.length; i++) {
        if (!newFilled[i]) { nextIdx = i; break; }
      }
      if (nextIdx === -1) {
        for (let i = 0; i < activeIdx; i++) {
          if (!newFilled[i]) { nextIdx = i; break; }
        }
      }
      if (nextIdx === -1) {
        const nextErrors = isCorrect ? errors : errors + 1;
        finishGame(nextErrors, newFilled);
      } else {
        setActiveIdx(nextIdx);
      }
    }, FEEDBACK_MS);
  }, [phase, game, activeIdx, filled, errors, feedbackForIdx, finishGame]);

  // pick a cell directly (skip-around support)
  const handleCellClick = useCallback((idx: number) => {
    if (phase !== 'solving' || !game) return;
    if (feedbackForIdx !== null) return;
    if (filled[idx]) return;
    setActiveIdx(idx);
  }, [phase, game, filled, feedbackForIdx]);

  useEffect(() => () => { if (feedbackRef.current) clearTimeout(feedbackRef.current); }, []);

  const correctCount = useMemo(() => filled.filter(f => f?.correct).length, [filled]);
  const filledCount = useMemo(() => filled.filter(Boolean).length, [filled]);

  // ---------- Settings screen ----------
  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🔣</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Тайный шифр</h2>
              <p className="text-xs text-gray-500">Запомните → восстановите</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            На 5 секунд покажем фигуры со скрытым в каждой знаком. Запомните пары — затем
            заполните таблицу по памяти, выбирая знак из нижней панели.
          </p>
          <span className="text-gray-600 font-medium text-sm">Сложность</span>
          <div className="flex flex-col gap-3 mt-2 mb-6">
            {(Object.entries(DIFF) as [Difficulty, DiffCfg][]).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setDiff(key)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                  diff === key
                    ? 'bg-fuchsia-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-fuchsia-50'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-sm font-normal ${diff === key ? 'text-fuchsia-100' : 'text-gray-400'}`}>{c.desc}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => startGame(diff)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (!game) return null;

  // ---------- Memorize screen ----------
  if (phase === 'memorize') {
    return (
      <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
        <div className="glass rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
          <span className="text-sm text-gray-500">Запомните пары</span>
          <span className="text-2xl font-bold text-fuchsia-600 tabular-nums">{memorizeLeft}</span>
        </div>
        <div
          className="grid gap-3 sm:gap-5 w-full max-w-3xl px-2 justify-center"
          style={{ gridTemplateColumns: `repeat(${Math.min(game.shapeIds.length, 5)}, minmax(0, 1fr))` }}
        >
          {game.shapeIds.map(sid => (
            <div key={sid} className="glass rounded-2xl p-3 sm:p-4 flex items-center justify-center shadow-sm">
              <ShapeIcon id={sid} symbol={game.mapping[sid]} size={84} symColor="#9333ea" />
            </div>
          ))}
        </div>
        <div className="w-full max-w-md h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full"
            style={{
              width: `${100 - (memorizeLeft / (MEMORIZE_MS / 1000)) * 100}%`,
              transition: 'width 200ms linear',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center px-4">
          Через {memorizeLeft} {pluralSec(memorizeLeft)} знаки спрячутся
        </p>
      </div>
    );
  }

  // ---------- Result screen ----------
  if (phase === 'result') {
    const total = filled.length;
    return (
      <div className="flex flex-col items-center gap-5 py-6 animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-3">🔣</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Шифр раскрыт!</h2>
          <p className="text-gray-400 text-sm mb-5">{cfg.label} · {cfg.n} фигур</p>
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Время</span>
              <span className="font-bold text-gray-800 text-lg">{fmtTime(elapsed)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Верно</span>
              <span className="font-bold text-emerald-600 text-lg">{correctCount} / {total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Ошибок</span>
              <span className={`font-bold text-lg ${errors > 0 ? 'text-red-500' : 'text-gray-400'}`}>{errors}</span>
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
        </div>
      </div>
    );
  }

  // ---------- Solving screen ----------
  const capPx = cfg.rows === 3 ? 840 : cfg.rows === 4 ? 720 : 620;
  const gridMaxWidth = `min(${capPx}px, calc((100vh - 320px) * ${cfg.cols} / ${cfg.rows}))`;
  return (
    <div className="flex flex-col gap-2 sm:gap-3 animate-fade-in pb-2">
      {/* HUD */}
      <div className="glass rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Заполнено</div>
          <div className="font-bold text-gray-800 text-sm sm:text-base">{filledCount} / {filled.length}</div>
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
          className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full transition-all duration-300"
          style={{ width: `${(filledCount / filled.length) * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div className="glass rounded-2xl p-2 sm:p-3 shadow-sm mx-auto w-full" style={{ maxWidth: gridMaxWidth }}>
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}
        >
          {game.cells.map((sid, idx) => {
            const f = filled[idx];
            const isActive = idx === activeIdx && !f;
            const showFeedback = feedbackForIdx === idx && f;
            let bg = 'bg-white/60';
            let border = 'border-transparent';
            if (showFeedback) {
              bg = f.correct ? 'bg-emerald-100' : 'bg-rose-100';
              border = f.correct ? 'border-emerald-400' : 'border-rose-400';
            } else if (f) {
              bg = f.correct ? 'bg-emerald-50' : 'bg-rose-50';
            } else if (isActive) {
              bg = 'bg-fuchsia-50';
              border = 'border-fuchsia-400';
            }
            const symColor = f?.correct ? '#059669' : f ? '#dc2626' : '#1e293b';
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!!f}
                className={`relative aspect-square rounded-xl border-2 ${border} ${bg} flex items-center justify-center transition-all active:scale-95 disabled:cursor-default`}
              >
                <ShapeIcon
                  id={sid}
                  symbol={f?.sym}
                  fill
                  color={isActive ? '#a21caf' : '#1e293b'}
                  symColor={symColor}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-fuchsia-500 ring-2 ring-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Symbol palette — same width as grid */}
      <div className="glass rounded-2xl p-2 shadow-sm sticky bottom-2 z-10 mx-auto w-full" style={{ maxWidth: gridMaxWidth }}>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${game.symbols.length}, minmax(0, 1fr))` }}
        >
          {game.symbols.map(sym => (
            <button
              key={sym}
              onClick={() => handleSymbolClick(sym)}
              disabled={feedbackForIdx !== null}
              className="h-14 sm:h-16 rounded-xl bg-white/80 hover:bg-fuchsia-50 active:scale-95 transition-all flex items-center justify-center shadow-sm border border-gray-100 disabled:opacity-50"
            >
              <SymbolIcon id={sym} size={32} color="#7c3aed" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
