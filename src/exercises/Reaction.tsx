import { useState, useEffect, useRef, useCallback } from 'react';
import { saveResult } from '../lib/auth';

const BALL_R = 28;
const INITIAL_SPEED = 1.8;
const SPEED_INCREMENT = 0.07;
const LIVES = 3;
const SPAWN_MARGIN = 140; // px from each edge — ball always spawns in safe zone

type Phase = 'idle' | 'playing' | 'result';

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Set to Date.now() on the frame the ball first becomes visible */
  spawnTime: number;
  /** False until the first rAF tick — used to stamp spawnTime accurately */
  visible: boolean;
}

function createBall(speed: number, areaW: number, areaH: number): BallState {
  const safeW = Math.max(areaW - 2 * SPAWN_MARGIN, 100);
  const safeH = Math.max(areaH - 2 * SPAWN_MARGIN, 100);
  const x = SPAWN_MARGIN + Math.random() * safeW;
  const y = SPAWN_MARGIN + Math.random() * safeH;
  const angle = Math.random() * Math.PI * 2;
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spawnTime: 0, visible: false };
}

export default function Reaction() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [areaSize, setAreaSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setAreaSize({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [ball, setBall] = useState<BallState | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [flashOk, setFlashOk] = useState(false);
  const [flashMiss, setFlashMiss] = useState(false);

  const animRef = useRef<number>(0);
  const ballRef = useRef<BallState | null>(null);
  const livesRef = useRef(LIVES);
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const phaseRef = useRef<Phase>('idle');
  const savedRef = useRef(false);
  const areaSizeRef = useRef(areaSize);
  areaSizeRef.current = areaSize;

  const endGame = useCallback(() => {
    phaseRef.current = 'result';
    setPhase('result');
    cancelAnimationFrame(animRef.current);
    setBall(null);
  }, []);

  const doSpawn = useCallback(() => {
    // Read actual container size at spawn time for accurate placement
    let w = areaSizeRef.current.w;
    let h = areaSizeRef.current.h;
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      if (r.width > 0) w = r.width;
      if (r.height > 0) h = r.height;
    }
    const nb = createBall(speedRef.current, w, h);
    ballRef.current = nb;
    setBall({ ...nb });
  }, []);

  const startGame = useCallback(() => {
    livesRef.current = LIVES;
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    setLives(LIVES);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setReactionTimes([]);
    setFlashOk(false);
    setFlashMiss(false);
    phaseRef.current = 'playing';
    setPhase('playing');
    savedRef.current = false;
  }, []);

  // Save result when game ends
  useEffect(() => {
    if (phase === 'result' && !savedRef.current) {
      savedRef.current = true;
      const reactionScore = Math.min(100, score * 5);
      const avgMs = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      const bestMs = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
      saveResult('reaction', reactionScore, {
        catches: score,
        avgReactionMs: avgMs,
        bestReactionMs: bestMs,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Spawn first ball once phase becomes 'playing'
  useEffect(() => {
    if (phase === 'playing') doSpawn();
  }, [phase, doSpawn]);

  // Animation loop
  useEffect(() => {
    if (phase !== 'playing') return;

    const tick = () => {
      if (phaseRef.current !== 'playing') return;
      const b = ballRef.current;
      if (!b) return;

      const { w, h } = areaSizeRef.current;

      // Stamp spawnTime on first visible frame
      if (!b.visible) {
        const stamped = { ...b, visible: true, spawnTime: Date.now() };
        ballRef.current = stamped;
        setBall({ ...stamped });
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      let { x, y, vx, vy } = b;
      x += vx;
      y += vy;

      // Use actual container bounds if available
      let bw = w, bh = h;
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0) bw = r.width;
        if (r.height > 0) bh = r.height;
      }

      if (x < -BALL_R || x > bw + BALL_R || y < -BALL_R || y > bh + BALL_R) {
        // Miss — immediately null the ball to prevent any re-processing
        ballRef.current = null;
        setBall(null);

        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        setLives(newLives);
        setFlashMiss(true);
        setTimeout(() => setFlashMiss(false), 400);
        if (newLives <= 0) { endGame(); return; }
        speedRef.current = Math.max(INITIAL_SPEED, speedRef.current - 0.05);
        doSpawn();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const updated = { ...b, x, y };
      ballRef.current = updated;
      setBall({ ...updated });
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, endGame, doSpawn]);

  // Click handler — distance check against current ball position
  const handleAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'playing' || !ballRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dist = Math.hypot(cx - ballRef.current.x, cy - ballRef.current.y);

    if (dist <= BALL_R * 1.6) {
      // Only measure if ball is actually visible
      const rt = ballRef.current.visible ? Date.now() - ballRef.current.spawnTime : 0;
      if (rt > 0) setReactionTimes(prev => [...prev, rt]);

      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      speedRef.current += SPEED_INCREMENT;
      setSpeed(speedRef.current);
      setFlashOk(true);
      setTimeout(() => setFlashOk(false), 180);
      doSpawn();
    }
  }, [doSpawn]);

  // Stats
  const avg = reactionTimes.length > 0
    ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
    : '—';
  const best = reactionTimes.length > 0
    ? (Math.min(...reactionTimes) / 1000).toFixed(2)
    : '—';

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
        <div className="glass rounded-2xl p-6 text-center shadow-sm max-w-md">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Реакция на шарик</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Кликайте по шарику до того, как он вылетит за край. {LIVES} жизни. Скорость постепенно растёт.
          </p>
          <button onClick={startGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
            Начать
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center shadow-lg w-80">
          <div className="text-6xl mb-3">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Игра окончена!</h2>
          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Очки:</span>
            <span className="font-bold text-2xl text-red-500">{score}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Средняя реакция:</span>
            <span className="font-bold text-gray-800">{avg} с</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Лучшая реакция:</span>
            <span className="font-bold text-green-600">{best} с</span>
          </div>
        </div>
        <button onClick={startGame} className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
          Играть снова
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* HUD */}
      <div className={`flex items-center justify-between rounded-2xl px-5 py-3 shadow-sm transition-colors duration-200 flex-shrink-0 ${flashMiss ? 'bg-red-100' : 'glass'}`}>
        <div>
          <span className="text-gray-500 text-sm">Очки: </span>
          <span className="font-bold text-red-500 text-xl">{score}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: LIVES }).map((_, i) => (
            <span key={i} className={`text-xl transition-all duration-300 ${i < lives ? 'opacity-100' : 'opacity-20 scale-75'}`}>❤️</span>
          ))}
        </div>
        <div>
          <span className="text-gray-500 text-sm">Скорость: </span>
          <span className="font-bold text-gray-700">{speed.toFixed(1)}x</span>
        </div>
      </div>

      {/* Play area — full remaining height */}
      <div
        ref={containerRef}
        onClick={handleAreaClick}
        className="flex-1 relative rounded-2xl overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          cursor: 'crosshair',
          minHeight: 420,
        }}
      >
        {/* Stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: i % 5 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 2 : 1,
              left: `${(i * 73 + 37) % 100}%`,
              top: `${(i * 113 + 51) % 100}%`,
              opacity: 0.1 + (i % 6) * 0.05,
            }}
          />
        ))}

        {/* Ball — pure div, no SVG, click handled by parent */}
        {ball && ball.visible && (
          <div
            style={{
              position: 'absolute',
              left: ball.x - BALL_R,
              top: ball.y - BALL_R,
              width: BALL_R * 2,
              height: BALL_R * 2,
              borderRadius: '50%',
              background: flashOk ? '#fbbf24' : '#ef4444',
              boxShadow: flashOk
                ? '0 0 28px 10px rgba(251,191,36,0.55)'
                : '0 0 20px 6px rgba(239,68,68,0.45)',
              transition: 'background 0.1s, box-shadow 0.1s',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
