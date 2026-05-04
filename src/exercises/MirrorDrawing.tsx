import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveResult } from '../lib/auth';

type Point = [number, number];
type Segment = [Point, Point];

interface FigureData {
  name: string;
  segments: Segment[];
}

const GRID = 12;
const CELL = 22;
const MARGIN = 8;
const SVG_DIM = MARGIN * 2 + GRID * CELL; // 280

function sx(x: number) { return MARGIN + x * CELL; }
function sy(y: number) { return MARGIN + y * CELL; }

function normKey(seg: Segment): string {
  const [a, b] = [seg[0], seg[1]].sort(([ax, ay], [bx, by]) =>
    ax !== bx ? ax - bx : ay - by
  );
  return `${a[0]},${a[1]}-${b[0]},${b[1]}`;
}

function mirrorSeg(seg: Segment): Segment {
  return [[GRID - seg[0][0], seg[0][1]], [GRID - seg[1][0], seg[1][1]]];
}

function parseKey(key: string): Segment {
  const [p1s, p2s] = key.split('-');
  const [x1, y1] = p1s.split(',').map(Number);
  const [x2, y2] = p2s.split(',').map(Number);
  return [[x1, y1], [x2, y2]];
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// All figures are LEFT HALVES (x=0..6) of symmetric shapes.
// The user draws the right half (x=6..12) on the right canvas.
// Mirror axis is at x=6.
// IMPORTANT: no two adjacent segments sharing a vertex are collinear —
// this prevents the user from needing to draw "half" of a straight line.
const FIGURES: FigureData[] = [
  {
    name: 'Ёлка',
    segments: [
      [[6, 0], [2, 4]],
      [[2, 4], [4, 4]],
      [[4, 4], [1, 7]],
      [[1, 7], [3, 7]],
      [[3, 7], [4, 10]],
      [[4, 10], [4, 12]],
      [[4, 12], [6, 12]],
    ],
  },
  {
    name: 'Рыба',
    segments: [
      // oval body: nose at (6,1), widens then narrows to tail split at (4,9)
      [[6, 1], [3, 4]],
      [[3, 4], [2, 7]],
      [[2, 7], [4, 9]],
      // forked tail: outer prong + bottom edge + inner fork line
      [[4, 9], [3, 11]],
      [[3, 11], [6, 12]],
      [[4, 9], [6, 10]],
    ],
  },
  {
    name: 'Гриб',
    segments: [
      [[6, 1], [0, 5]],
      [[0, 5], [0, 8]],
      [[0, 8], [2, 9]],
      [[2, 9], [3, 8]],
      [[3, 8], [3, 12]],
      [[3, 12], [6, 12]],
    ],
  },
  {
    name: 'Птица',
    segments: [
      // M-shape wingspan: top center → wing sweeps out → folds → body bottom
      [[6, 2], [4, 3]],
      [[4, 3], [2, 5]],
      [[2, 5], [1, 7]],
      [[1, 7], [3, 8]],
      [[3, 8], [4, 10]],
      [[4, 10], [6, 11]],
    ],
  },
  {
    name: 'Дерево',
    segments: [
      // rounded canopy: top → widens at mid-height → narrows to trunk
      [[6, 1], [3, 3]],
      [[3, 3], [1, 6]],
      [[1, 6], [2, 9]],
      [[2, 9], [4, 9]],
      [[4, 9], [4, 12]],
      [[4, 12], [6, 12]],
    ],
  },
  {
    name: 'Маяк',
    segments: [
      [[6, 0], [4, 2]],
      [[4, 2], [4, 4]],
      [[4, 4], [3, 4]],
      [[3, 4], [3, 10]],
      [[3, 10], [0, 12]],
      [[0, 12], [6, 12]],
    ],
  },
  {
    name: 'Бабочка',
    segments: [
      [[6, 3], [3, 1]],
      [[3, 1], [1, 4]],
      [[1, 4], [4, 5]],
      [[4, 5], [1, 7]],
      [[1, 7], [3, 10]],
      [[3, 10], [6, 8]],
    ],
  },
  {
    name: 'Сердце',
    segments: [
      [[6, 2], [5, 0]],
      [[5, 0], [3, 0]],
      [[3, 0], [1, 2]],
      [[1, 2], [1, 5]],
      [[1, 5], [3, 8]],
      [[3, 8], [6, 12]],
    ],
  },
  {
    name: 'Тюльпан',
    segments: [
      [[6, 0], [4, 1]],
      [[4, 1], [3, 3]],
      [[3, 3], [1, 4]],
      [[1, 4], [3, 6]],
      [[3, 6], [4, 6]],
      [[4, 6], [4, 12]],
      [[4, 12], [6, 12]],
    ],
  },
  {
    name: 'Корона',
    segments: [
      [[6, 1], [5, 3]],
      [[5, 3], [4, 1]],
      [[4, 1], [3, 4]],
      [[3, 4], [2, 1]],
      [[2, 1], [0, 5]],
      [[0, 5], [0, 7]],
      [[0, 7], [6, 7]],
    ],
  },
  {
    name: 'Ракета',
    segments: [
      [[6, 0], [4, 2]],
      [[4, 2], [4, 7]],
      [[4, 7], [2, 8]],
      [[2, 8], [4, 9]],
      [[4, 9], [4, 11]],
      [[4, 11], [6, 11]],
    ],
  },
  {
    name: 'Ваза',
    segments: [
      [[6, 1], [3, 1]],
      [[3, 1], [3, 3]],
      [[3, 3], [1, 5]],
      [[1, 5], [1, 8]],
      [[1, 8], [3, 10]],
      [[3, 10], [3, 12]],
      [[3, 12], [6, 12]],
    ],
  },
  {
    name: 'Колокол',
    segments: [
      [[6, 1], [4, 1]],
      [[4, 1], [4, 3]],
      [[4, 3], [2, 5]],
      [[2, 5], [1, 9]],
      [[1, 9], [0, 9]],
      [[0, 9], [0, 11]],
      [[0, 11], [6, 11]],
    ],
  },
  {
    name: 'Парус',
    segments: [
      [[6, 1], [3, 4]],
      [[3, 4], [3, 7]],
      [[3, 7], [0, 8]],
      [[0, 8], [1, 10]],
      [[1, 10], [6, 10]],
    ],
  },
  {
    name: 'Капля',
    segments: [
      [[6, 1], [3, 4]],
      [[3, 4], [1, 8]],
      [[1, 8], [3, 11]],
      [[3, 11], [6, 12]],
    ],
  },
  {
    name: 'Лист',
    segments: [
      [[6, 1], [4, 2]],
      [[4, 2], [1, 5]],
      [[1, 5], [2, 9]],
      [[2, 9], [5, 11]],
      [[5, 11], [6, 12]],
    ],
  },
  {
    name: 'Ёжик',
    segments: [
      [[6, 5], [5, 4]],
      [[5, 4], [4, 5]],
      [[4, 5], [3, 4]],
      [[3, 4], [2, 5]],
      [[2, 5], [1, 6]],
      [[1, 6], [2, 8]],
      [[2, 8], [5, 9]],
      [[5, 9], [6, 8]],
    ],
  },
  {
    name: 'Замок',
    segments: [
      [[6, 3], [4, 3]],
      [[4, 3], [4, 4]],
      [[4, 4], [3, 4]],
      [[3, 4], [3, 3]],
      [[3, 3], [1, 3]],
      [[1, 3], [1, 12]],
      [[1, 12], [6, 12]],
    ],
  },
  {
    name: 'Чайник',
    segments: [
      [[6, 4], [5, 3]],
      [[5, 3], [4, 4]],
      [[4, 4], [2, 5]],
      [[2, 5], [1, 8]],
      [[1, 8], [2, 10]],
      [[2, 10], [4, 10]],
      [[4, 10], [6, 9]],
    ],
  },
  {
    name: 'Якорь',
    segments: [
      [[6, 2], [5, 1]],
      [[5, 1], [4, 2]],
      [[4, 2], [5, 3]],
      [[5, 3], [5, 9]],
      [[5, 9], [3, 9]],
      [[3, 9], [3, 8]],
      [[3, 8], [1, 8]],
      [[1, 8], [3, 11]],
      [[3, 11], [6, 11]],
    ],
  },
  {
    name: 'Стрекоза',
    segments: [
      [[6, 1], [5, 2]],
      [[5, 2], [4, 4]],
      [[4, 4], [2, 2]],
      [[2, 2], [0, 4]],
      [[0, 4], [4, 5]],
      [[4, 5], [1, 7]],
      [[1, 7], [0, 9]],
      [[0, 9], [4, 8]],
      [[4, 8], [5, 11]],
      [[5, 11], [6, 12]],
    ],
  },
  {
    name: 'Кит',
    segments: [
      [[6, 4], [5, 3]],
      [[5, 3], [3, 4]],
      [[3, 4], [1, 6]],
      [[1, 6], [3, 8]],
      [[3, 8], [2, 9]],
      [[2, 9], [3, 10]],
      [[3, 10], [6, 9]],
      [[6, 9], [5, 7]],
      [[5, 7], [6, 6]],
    ],
  },
  {
    name: 'Парусник',
    segments: [
      [[6, 0], [2, 6]],
      [[2, 6], [6, 6]],
      [[6, 6], [5, 9]],
      [[5, 9], [1, 9]],
      [[1, 9], [2, 11]],
      [[2, 11], [6, 11]],
    ],
  },
  {
    name: 'Снежинка',
    segments: [
      [[6, 6], [3, 6]],
      [[3, 6], [4, 5]],
      [[3, 6], [4, 7]],
      [[6, 6], [4, 3]],
      [[4, 3], [5, 2]],
      [[4, 3], [3, 4]],
      [[6, 6], [4, 9]],
      [[4, 9], [5, 10]],
      [[4, 9], [3, 10]],
    ],
  },
  {
    name: 'Лебедь',
    segments: [
      [[6, 2], [5, 1]],
      [[5, 1], [4, 2]],
      [[4, 2], [4, 4]],
      [[4, 4], [3, 5]],
      [[3, 5], [1, 6]],
      [[1, 6], [2, 9]],
      [[2, 9], [4, 10]],
      [[4, 10], [6, 8]],
    ],
  },
  {
    name: 'Скрипка',
    segments: [
      [[6, 0], [5, 1]],
      [[5, 1], [4, 1]],
      [[4, 1], [4, 3]],
      [[4, 3], [3, 3]],
      [[3, 3], [4, 5]],
      [[4, 5], [2, 6]],
      [[2, 6], [3, 8]],
      [[3, 8], [2, 10]],
      [[2, 10], [4, 11]],
      [[4, 11], [6, 11]],
    ],
  },
  {
    name: 'Крепость',
    segments: [
      [[6, 4], [5, 4]],
      [[5, 4], [5, 5]],
      [[5, 5], [4, 5]],
      [[4, 5], [4, 4]],
      [[4, 4], [3, 4]],
      [[3, 4], [3, 1]],
      [[3, 1], [2, 1]],
      [[2, 1], [2, 2]],
      [[2, 2], [1, 2]],
      [[1, 2], [1, 4]],
      [[1, 4], [0, 4]],
      [[0, 4], [0, 12]],
      [[0, 12], [6, 12]],
    ],
  },
  {
    name: 'Слон',
    segments: [
      [[6, 2], [4, 2]],
      [[4, 2], [3, 3]],
      [[3, 3], [3, 5]],
      [[3, 5], [1, 5]],
      [[1, 5], [1, 9]],
      [[1, 9], [2, 9]],
      [[2, 9], [2, 11]],
      [[2, 11], [4, 11]],
      [[4, 11], [4, 9]],
      [[4, 9], [5, 9]],
      [[5, 9], [6, 7]],
    ],
  },
];

export default function MirrorDrawing() {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'complete' | 'result'>('idle');
  const [figureIdx, setFigureIdx] = useState(0);
  const [drawnKeys, setDrawnKeys] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Point | null>(null);
  const [errors, setErrors] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [flashSeg, setFlashSeg] = useState<Segment | null>(null);
  const startTimeRef = useRef(0);

  const figure = FIGURES[figureIdx];

  const requiredKeys = useMemo(
    () => new Set(figure.segments.map(seg => normKey(mirrorSeg(seg)))),
    [figure],
  );

  const startGame = useCallback(() => {
    const idx = Math.floor(Math.random() * FIGURES.length);
    setFigureIdx(idx);
    setDrawnKeys(new Set());
    setSelected(null);
    setErrors(0);
    setTotalTime(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  const handlePointClick = useCallback((x: number, y: number) => {
    if (phase !== 'playing') return;
    const pt: Point = [x, y];

    if (!selected) {
      setSelected(pt);
      return;
    }

    if (selected[0] === pt[0] && selected[1] === pt[1]) {
      setSelected(null);
      return;
    }

    const seg: Segment = [selected, pt];
    const key = normKey(seg);
    setSelected(null);

    if (drawnKeys.has(key)) return;

    if (requiredKeys.has(key)) {
      const newKeys = new Set(drawnKeys).add(key);
      setDrawnKeys(newKeys);

      if (newKeys.size === requiredKeys.size) {
        const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
        setTotalTime(secs);
        const scorePct = Math.max(0, 100 - errors * 10);
        saveResult('mirror-drawing', scorePct, {
          figureName: figure.name,
          errors,
          timeSec: secs,
          totalLines: requiredKeys.size,
        });
        setPhase('complete');
        setTimeout(() => setPhase('result'), 1500);
      }
    } else {
      setErrors(e => e + 1);
      setFlashSeg(seg);
      setTimeout(() => setFlashSeg(null), 700);
    }
  }, [phase, selected, drawnKeys, requiredKeys, errors, figure]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = (e.clientX - rect.left) * (SVG_DIM / rect.width);
    const vy = (e.clientY - rect.top) * (SVG_DIM / rect.height);
    const gx = Math.round((vx - MARGIN) / CELL);
    const gy = Math.round((vy - MARGIN) / CELL);
    // only right half (x >= GRID/2) is interactive
    if (gx < GRID / 2 || gx > GRID || gy < 0 || gy > GRID) return;
    const px = MARGIN + gx * CELL;
    const py = MARGIN + gy * CELL;
    if (Math.hypot(vx - px, vy - py) > CELL * 0.65) return;
    handlePointClick(gx, gy);
  }, [phase, handlePointClick]);

  const totalLines = requiredKeys.size;
  const drawnCount = drawnKeys.size;

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
        <div className="glass rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">🪞</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Зеркальный рисунок</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Слева — левая половина симметричного рисунка. Нажмите на две точки справа, чтобы провести линию и дорисовать правую половину. Ошибочные линии подсвечиваются красным и исчезают.
          </p>
          <div className="text-xs text-gray-400 mb-5 p-3 bg-white/50 rounded-lg">
            💡 Выберите первую точку, затем вторую — линия проведётся автоматически
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-3">🪞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Рисунок готов!</h2>
          <p className="text-gray-400 text-sm mb-5">«{figure.name}»</p>
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Время</span>
              <span className="font-bold text-gray-800 text-lg">{fmtTime(totalTime)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Линий</span>
              <span className="font-bold text-emerald-600 text-lg">{totalLines}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Ошибок</span>
              <span className={`font-bold text-lg ${errors > 0 ? 'text-red-500' : 'text-gray-400'}`}>{errors}</span>
            </div>
          </div>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
        >
          Другой рисунок
        </button>
      </div>
    );
  }

  // Playing and complete phases — single unified grid
  const AXIS = GRID / 2; // x=6
  const isComplete = phase === 'complete';
  const viewBox = `0 0 ${SVG_DIM} ${SVG_DIM}`;
  const gridLines = Array.from({ length: GRID + 1 }, (_, i) => i);
  const rightCols = gridLines.filter(i => i >= AXIS);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* HUD */}
      <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="text-center min-w-[70px]">
          <div className="text-xs text-gray-400 mb-0.5">Нарисовано</div>
          <div className="font-bold text-gray-800">{drawnCount} / {totalLines}</div>
        </div>
        <div className="text-center min-w-[70px]">
          <div className="text-xs text-gray-400 mb-0.5">Ошибки</div>
          <div className={`font-bold ${errors > 0 ? 'text-red-500' : 'text-gray-300'}`}>{errors}</div>
        </div>
        <div className="text-center min-w-[70px]">
          <div className="text-xs text-gray-400 mb-0.5">Время</div>
          <div className="font-bold text-gray-800">{fmtTime(elapsed)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
          style={{ width: totalLines > 0 ? `${(drawnCount / totalLines) * 100}%` : '0%' }}
        />
      </div>

      {/* Single grid */}
      <div className="flex justify-center relative">
        <svg
          viewBox={viewBox}
          className="w-full max-w-xl h-auto rounded-xl shadow-sm"
          style={{
            background: isComplete ? 'rgba(240,253,244,0.8)' : 'rgba(255,255,255,0.6)',
            cursor: isComplete ? 'default' : 'crosshair',
            transition: 'background 0.4s',
          }}
          onClick={handleSvgClick}
        >
          {/* Grid lines */}
          {gridLines.map(i => (
            <g key={i}>
              <line x1={sx(0)} y1={sy(i)} x2={sx(GRID)} y2={sy(i)} stroke="#dde3ed" strokeWidth="0.8" />
              <line x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(GRID)} stroke="#dde3ed" strokeWidth="0.8" />
            </g>
          ))}

          {/* Axis of symmetry */}
          <line x1={sx(AXIS)} y1={sy(0)} x2={sx(AXIS)} y2={sy(GRID)}
            stroke="#a78bfa" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.85" />

          {/* Pre-drawn left half */}
          {figure.segments.map((seg, i) => (
            <line
              key={`fig-${i}`}
              x1={sx(seg[0][0])} y1={sy(seg[0][1])}
              x2={sx(seg[1][0])} y2={sy(seg[1][1])}
              stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
            />
          ))}

          {/* User-drawn right half */}
          {Array.from(drawnKeys).map((key, i) => {
            const seg = parseKey(key);
            return (
              <line
                key={`drawn-${i}`}
                x1={sx(seg[0][0])} y1={sy(seg[0][1])}
                x2={sx(seg[1][0])} y2={sy(seg[1][1])}
                stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
              />
            );
          })}

          {/* Error flash */}
          {flashSeg && (
            <line
              x1={sx(flashSeg[0][0])} y1={sy(flashSeg[0][1])}
              x2={sx(flashSeg[1][0])} y2={sy(flashSeg[1][1])}
              stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
            />
          )}

          {/* Left half: small reference dots only (hidden in complete phase) */}
          {!isComplete && gridLines.filter(i => i < AXIS).map(i => gridLines.map(j => (
            <circle key={`ldot-${i}-${j}`} cx={sx(i)} cy={sy(j)} r="1.8" fill="#cbd5e1" />
          )))}

          {/* Right half: interactive dots (hidden in complete phase) */}
          {!isComplete && rightCols.flatMap(i => gridLines.map(j => {
            const isSelected = selected !== null && selected[0] === i && selected[1] === j;
            return (
              <g key={`rdot-${i}-${j}`}>
                <circle cx={sx(i)} cy={sy(j)} r="8" fill="transparent" />
                {isSelected && <circle cx={sx(i)} cy={sy(j)} r="9" fill="#6366f1" opacity="0.15" />}
                <circle
                  cx={sx(i)} cy={sy(j)}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#6366f1' : '#94a3b8'}
                />
              </g>
            );
          }))}
        </svg>

      </div>

      {/* Hint */}
      {!isComplete && (
        <p className="text-center text-xs text-gray-400">
          {selected
            ? '✅ Первая точка выбрана — нажмите вторую'
            : 'Нажмите на точку правой половины, чтобы начать линию'}
        </p>
      )}
    </div>
  );
}
