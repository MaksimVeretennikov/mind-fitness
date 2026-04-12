import { useState, useCallback, useRef, useEffect } from 'react';
import { saveResult } from '../lib/auth';

const BALL_RADIUS = 32;
const HIDDEN_COLOR = '#6366f1';
const HIDE_DELAY = 3000;

const BALL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#a3e635',
  '#fb923c', '#f43f5e', '#10b981', '#6366f1', '#e879f9',
];

interface Ball {
  id: number;
  x: number;
  y: number;
  number: number;
  color: string;
}

function placeBalls(count: number, w: number, h: number): Ball[] {
  const balls: Ball[] = [];
  const margin = BALL_RADIUS + 12;
  const colors = [...BALL_COLORS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, ok: boolean;
    let tries = 0;
    do {
      ok = true;
      x = margin + Math.random() * (w - 2 * margin);
      y = margin + Math.random() * (h - 2 * margin);
      for (const b of balls) {
        if (Math.hypot(b.x - x, b.y - y) < BALL_RADIUS * 2.5) { ok = false; break; }
      }
      tries++;
    } while (!ok && tries < 500);
    balls.push({ id: i, x, y, number: 0, color: colors[i % colors.length] });
  }
  const nums = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
  return balls.map((b, i) => ({ ...b, number: nums[i] }));
}

type Phase = 'settings' | 'memorize' | 'playing' | 'result';

export default function Balls() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [ballCount, setBallCount] = useState(12);

  const [balls, setBalls] = useState<Ball[]>([]);
  const [phase, setPhase] = useState<Phase>('settings');
  const [pendingStart, setPendingStart] = useState(false); // triggers spawn after area renders
  const [hideNumbers, setHideNumbers] = useState(false);
  const [nextExpected, setNextExpected] = useState(1);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [clickFlash, setClickFlash] = useState<{ id: number; ok: boolean } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [memorizeLeft, setMemorizeLeft] = useState(HIDE_DELAY / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBallCount = useRef(ballCount);
  const savedRef = useRef(false);

  // When pendingStart becomes true, the play area has just rendered — now we can measure and place balls
  useEffect(() => {
    if (!pendingStart) return;
    if (!areaRef.current) return;
    setPendingStart(false);

    const w = areaRef.current.clientWidth;
    const h = areaRef.current.clientHeight;
    const count = pendingBallCount.current;
    const newBalls = placeBalls(count, w, h);
    setBalls(newBalls);
    setHideNumbers(false);
    setNextExpected(1);
    setFound(new Set());
    setClickFlash(null);
    setElapsed(0);
    setErrors(0);

    let left = HIDE_DELAY / 1000;
    setMemorizeLeft(left);
    const cd = setInterval(() => {
      left -= 1;
      setMemorizeLeft(left);
      if (left <= 0) clearInterval(cd);
    }, 1000);

    hideTimerRef.current = setTimeout(() => {
      setHideNumbers(true);
      setPhase('playing');
    }, HIDE_DELAY);
  }, [pendingStart]);

  const startGame = useCallback(() => {
    // Clear any running timers first
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    pendingBallCount.current = ballCount;
    setPhase('memorize'); // render play area first
    setPendingStart(true); // useEffect above will fire after render
    savedRef.current = false;
  }, [ballCount]);

  // Save result on completion
  useEffect(() => {
    if (phase === 'result' && !savedRef.current) {
      savedRef.current = true;
      const score = Math.max(0, 100 - errors * 10);
      saveResult('balls', score, {
        elapsed,
        errors,
        ballCount: pendingBallCount.current,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Play timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleBallClick = (ball: Ball) => {
    if (phase !== 'playing') return;
    if (found.has(ball.id)) return;

    if (ball.number === nextExpected) {
      const newFound = new Set(found);
      newFound.add(ball.id);
      setFound(newFound);
      setClickFlash({ id: ball.id, ok: true });
      setTimeout(() => setClickFlash(f => f?.id === ball.id ? null : f), 500);
      const newNext = nextExpected + 1;
      setNextExpected(newNext);
      if (newNext > pendingBallCount.current) {
        setPhase('result');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } else {
      setErrors(e => e + 1);
      setClickFlash({ id: ball.id, ok: false });
      setTimeout(() => setClickFlash(f => f?.id === ball.id ? null : f), 500);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getBallFill = (ball: Ball) => {
    if (!hideNumbers) return ball.color;
    if (found.has(ball.id)) return '#4ade80';
    if (clickFlash?.id === ball.id) return clickFlash.ok ? '#22c55e' : '#f87171';
    return HIDDEN_COLOR;
  };

  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <div className="text-5xl mb-4 text-center">🎯</div>
          <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">Настройки</h2>
          <label className="block mb-6">
            <span className="text-gray-600 font-medium text-sm">
              Количество шаров: <strong className="text-orange-600">{ballCount}</strong>
            </span>
            <input type="range" min={5} max={15} step={1} value={ballCount}
              onChange={e => setBallCount(+e.target.value)}
              className="w-full mt-2 accent-orange-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5</span><span>15</span></div>
          </label>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            Каждый шарик своего цвета — запомните их положение. Через {HIDE_DELAY / 1000} сек номера скроются и все станут одного цвета. Нажимайте по порядку: 1, 2, 3…
          </p>
          <button onClick={startGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800">Отлично!</h2>
        <div className="glass rounded-2xl p-6 text-center shadow-lg w-64">
          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Время:</span>
            <span className="font-bold text-gray-800">{formatTime(elapsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ошибки:</span>
            <span className={`font-bold ${errors === 0 ? 'text-green-600' : 'text-orange-500'}`}>{errors}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPhase('settings')} className="px-6 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95">Настройки</button>
          <button onClick={startGame} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">Ещё раз</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 90px)' }}>
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-3 shadow-sm flex-shrink-0">
        <div>
          {phase === 'memorize' ? (
            <span className="text-yellow-600 font-semibold text-sm">Запомните номера — {memorizeLeft}с</span>
          ) : (
            <>
              <span className="text-gray-500 text-sm">Следующий: </span>
              <span className="font-bold text-orange-600 text-xl">{nextExpected}</span>
            </>
          )}
        </div>
        <div className="font-mono text-lg font-bold text-gray-700">{formatTime(elapsed)}</div>
        <div>
          <span className="text-gray-500 text-sm">Ошибок: </span>
          <span className="font-bold text-red-500">{errors}</span>
        </div>
      </div>

      <div
        ref={areaRef}
        className="flex-1 relative rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)', minHeight: 400 }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: i % 7 === 0 ? 2 : 1, height: i % 7 === 0 ? 2 : 1, left: `${(i * 67 + 13) % 100}%`, top: `${(i * 97 + 29) % 100}%`, opacity: 0.1 + (i % 5) * 0.06 }} />
        ))}

        {balls.map(ball => {
          const fill = getBallFill(ball);
          const isFound = found.has(ball.id);
          const isFlashing = clickFlash?.id === ball.id;
          const showNum = !hideNumbers || isFound || (isFlashing && clickFlash?.ok);

          return (
            <div
              key={ball.id}
              onClick={() => handleBallClick(ball)}
              style={{
                position: 'absolute',
                left: ball.x - BALL_RADIUS,
                top: ball.y - BALL_RADIUS,
                width: BALL_RADIUS * 2,
                height: BALL_RADIUS * 2,
                borderRadius: '50%',
                background: fill,
                cursor: isFound ? 'default' : 'pointer',
                opacity: isFound ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s, opacity 0.4s',
                boxShadow: isFlashing
                  ? `0 0 22px 8px ${clickFlash?.ok ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)'}`
                  : '0 4px 14px rgba(0,0,0,0.4)',
                userSelect: 'none',
              }}
            >
              {showNum && (
                <span style={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: BALL_RADIUS * 0.85,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>
                  {ball.number}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
