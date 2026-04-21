import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap, Geographies, Geography, ZoomableGroup, Marker,
} from 'react-simple-maps';
import { saveResult } from '../lib/auth';
import { updateCountryProgressBatch, getWeakCountries } from '../lib/geographyDB';
import { useAuth } from '../contexts/AuthContext';
import {
  COUNTRIES, REGIONS, filterCountries, countryByCode,
  distanceKm,
  type Country, type Region, type Difficulty,
} from '../data/countries';
import { ISO2_TO_M49, M49_TO_ISO2 } from '../data/countryIds';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import './geography.css';

const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Phase = 'setup' | 'playing' | 'result';
type DiffChoice = Difficulty | 'mixed';

interface Question { country: Country }

interface Answered {
  country: Country;
  correct: boolean;
  clickedCode: string | null; // ISO-2 or null on timeout
  distanceKm: number;          // 0 if correct
  timedOut: boolean;
}

interface Props { onBack: () => void }

const QUESTION_TIME = 15;
const REGION_VIEW: Record<Region | 'all', { center: [number, number]; zoom: number }> = {
  all:      { center: [10, 20],   zoom: 1 },
  europe:   { center: [15, 52],   zoom: 3.8 },
  asia:     { center: [95, 30],   zoom: 2 },
  africa:   { center: [20, 0],    zoom: 2.2 },
  americas: { center: [-75, 0],   zoom: 1.7 },
  oceania:  { center: [155, -20], zoom: 2.4 },
};

// Countries too small to be present in the 110m topojson — skip in map exercise.
const SKIP_IN_MAP = new Set([
  'VA', 'SM', 'MC', 'LI', 'AD', 'MT', 'SG', 'BH', 'MV', 'NR', 'TV', 'PW', 'MH',
  'FM', 'KI', 'WS', 'TO', 'VU', 'SB', 'ST', 'CV', 'KM', 'SC', 'MU', 'DM', 'GD',
  'LC', 'VC', 'KN', 'AG', 'BB', 'XK',
]);

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcScore(timeLeft: number, streak: number): number {
  const timePct = timeLeft / QUESTION_TIME;
  const speedBonus = timePct > 0.66 ? 5 : timePct > 0.33 ? 3 : 0;
  const streakBonus = streak >= 5 ? 3 : streak >= 3 ? 1 : 0;
  return 10 + speedBonus + streakBonus;
}

function formatKm(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)} тыс. км`;
  return `${km} км`;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function GeographyMap({ onBack }: Props) {
  const { user, setShowAuthModal } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DiffChoice>('easy');
  const [count, setCount] = useState(10);
  const [weakCodes, setWeakCodes] = useState<string[] | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [locked, setLocked] = useState(false);
  const [clicked, setClicked] = useState<{ code: string | null; lat: number; lng: number } | null>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [floatingPts, setFloatingPts] = useState<{ id: number; value: number } | null>(null);
  const [sessionStart, setSessionStart] = useState(0);
  const savedRef = useRef(false);
  const pointIdRef = useRef(0);
  const answeredRef = useRef<Answered[]>([]);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);

  useEffect(() => {
    if (!user) { setWeakCodes([]); return; }
    getWeakCountries('map', 30, 2).then(codes => setWeakCodes(codes));
  }, [user]);

  const mapPool = useMemo(() => {
    return filterCountries(region, difficulty)
      .filter(c => !SKIP_IN_MAP.has(c.code) && ISO2_TO_M49[c.code]);
  }, [region, difficulty]);

  const view = REGION_VIEW[region];

  /* ─── Game control ───────────────────────────────────────────────────── */

  const startGame = useCallback((pool?: Country[]) => {
    const source = (pool ?? mapPool).filter(c => !SKIP_IN_MAP.has(c.code));
    if (source.length === 0) return;
    const selected = shuffle(source).slice(0, Math.min(count, source.length));
    setQuestions(selected.map(country => ({ country })));
    setQIndex(0);
    setAnswered([]);
    answeredRef.current = [];
    scoreRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(QUESTION_TIME);
    setLocked(false);
    setClicked(null);
    setHoverCode(null);
    setSessionStart(Date.now());
    savedRef.current = false;
    setPhase('playing');
  }, [mapPool, count]);

  const replayWeak = useCallback(() => {
    if (!weakCodes || weakCodes.length === 0) return;
    const pool = weakCodes.map(countryByCode).filter((c): c is Country => !!c && !SKIP_IN_MAP.has(c.code));
    if (pool.length === 0) return;
    startGame(pool);
  }, [weakCodes, startGame]);

  const replayMistakes = useCallback(() => {
    const pool = answered.filter(a => !a.correct).map(a => a.country);
    if (pool.length === 0) return;
    startGame(pool);
  }, [answered, startGame]);

  /* ─── Timer ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (phase !== 'playing' || locked) return;
    if (timeLeft <= 0) { handleAnswer(null, null); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 0.1), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, locked]);

  /* ─── Handle click on a country ──────────────────────────────────────── */

  function handleAnswer(clickedCode: string | null, coords: [number, number] | null) {
    if (locked || phase !== 'playing') return;
    setLocked(true);

    const q = questions[qIndex];
    const isTimeout = clickedCode === null;
    const isCorrect = clickedCode === q.country.code;

    let gained = 0;
    let dist = 0;

    if (isCorrect) {
      gained = calcScore(timeLeft, streakRef.current);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      const ns = streakRef.current + 1;
      streakRef.current = ns;
      setStreak(ns);
      if (ns > bestStreakRef.current) bestStreakRef.current = ns;
      setBestStreak(bestStreakRef.current);
      pointIdRef.current += 1;
      setFloatingPts({ id: pointIdRef.current, value: gained });
      setTimeout(() => setFloatingPts(null), 900);
    } else {
      streakRef.current = 0;
      setStreak(0);
      if (clickedCode) {
        const c = countryByCode(clickedCode);
        if (c) dist = distanceKm(c, q.country);
      }
    }

    setClicked(coords ? { code: clickedCode, lat: coords[1], lng: coords[0] } : null);
    const newItem: Answered = {
      country: q.country,
      correct: isCorrect,
      clickedCode,
      distanceKm: dist,
      timedOut: isTimeout,
    };
    answeredRef.current = [...answeredRef.current, newItem];
    setAnswered(answeredRef.current);

    const delay = isCorrect ? 900 : 1700;
    setTimeout(() => advance(), delay);
  }

  function advance() {
    const next = qIndex + 1;
    if (next >= questions.length) { finish(); return; }
    setQIndex(next);
    setClicked(null);
    setHoverCode(null);
    setLocked(false);
    setTimeLeft(QUESTION_TIME);
  }

  function finish() {
    if (savedRef.current) { setPhase('result'); return; }
    savedRef.current = true;

    const finalAnswered = answeredRef.current;
    const finalScore = scoreRef.current;
    const finalBestStreak = bestStreakRef.current;
    const correctCount = finalAnswered.filter(a => a.correct).length;
    const total = questions.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const timeSec = Math.round((Date.now() - sessionStart) / 1000);

    const mistakes = finalAnswered
      .filter(a => !a.correct)
      .map(a => ({
        display: `${a.country.flag} ${a.country.name}`,
        chosen: a.timedOut
          ? '⏱ время вышло'
          : a.clickedCode
            ? (countryByCode(a.clickedCode)?.name ?? a.clickedCode) + ` (${formatKm(a.distanceKm)})`
            : '—',
        correct: a.country.name,
      }));

    saveResult('geography-map', scorePct, {
      correct: correctCount,
      total,
      errors: total - correctCount,
      score: finalScore,
      bestStreak: finalBestStreak,
      region,
      difficulty,
      timeSec,
      mistakes,
    });

    updateCountryProgressBatch('map', finalAnswered.map(a => ({
      countryCode: a.country.code,
      correct: a.correct,
    })));

    setPhase('result');
  }

  /* ─── Setup screen ───────────────────────────────────────────────────── */

  if (phase === 'setup') {
    return (
      <div className="geo-setup animate-fade-in">
        <div className="glass rounded-3xl px-10 py-7 text-center shadow-sm geo-setup-header">
          <div className="text-5xl mb-4 animate-float">🗺️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Где на карте?</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Найди страну на карте мира — тренирует пространственную память
          </p>
        </div>

        <div className="glass rounded-2xl p-7 w-full max-w-2xl shadow-sm flex flex-col gap-6">
          <div>
            <p className="geo-label">Регион</p>
            <div className="geo-pills">
              {REGIONS.map(r => {
                const c = COUNTRIES.filter(co => (r.id === 'all' || co.region === r.id) && !SKIP_IN_MAP.has(co.code)).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`geo-pill ${region === r.id ? 'geo-pill--active' : ''}`}
                  >
                    <span className="geo-pill-emoji">{r.emoji}</span>
                    <span>{r.label}</span>
                    <span className="geo-pill-count">{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="geo-label">Сложность</p>
            <div className="geo-pills">
              {([
                { id: 'easy',   label: 'Легко',    emoji: '🌱' },
                { id: 'medium', label: 'Средне',   emoji: '🌿' },
                { id: 'hard',   label: 'Сложно',   emoji: '🌲' },
                { id: 'mixed',  label: 'Смешанный', emoji: '🎲' },
              ] as const).map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`geo-pill ${difficulty === d.id ? 'geo-pill--active' : ''}`}
                >
                  <span className="geo-pill-emoji">{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="geo-label">Количество вопросов</p>
            <div className="flex gap-2 justify-center">
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="geo-pool-info">
            {mapPool.length === 0
              ? 'В этом регионе и сложности недостаточно стран для карты.'
              : `Доступно стран: ${mapPool.length}. Будет задано: ${Math.min(count, mapPool.length)}`}
          </div>

          <button
            onClick={() => startGame()}
            disabled={mapPool.length === 0}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Начать
          </button>

          {weakCodes && weakCodes.length > 0 && (
            <button
              onClick={replayWeak}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-700 glass hover:bg-white/80 transition-all active:scale-95 border border-indigo-200"
            >
              🔁 Повторить слабые страны ({weakCodes.length})
            </button>
          )}

          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs text-gray-500 hover:text-indigo-600 underline"
            >
              Войдите, чтобы результаты сохранялись
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─── Result screen ──────────────────────────────────────────────────── */

  if (phase === 'result') {
    const correctCount = answered.filter(a => a.correct).length;
    const total = questions.length;
    const accuracy = total > 0 ? correctCount / total : 0;
    const { label, tone } = pickResultLabel(accuracy);
    const scoreColor = toneToColor(tone);

    return (
      <div className="geo-result flex flex-col items-center gap-6 py-8 animate-fade-in max-w-3xl mx-auto px-4">
        <div className="glass rounded-2xl px-10 py-7 text-center shadow-sm w-full max-w-sm">
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>{score}</div>
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-3">Очки</p>
          <div className="geo-result-row">
            <div>
              <div className="geo-result-value">{correctCount} / {total}</div>
              <div className="geo-result-label">Точность</div>
            </div>
            <div>
              <div className="geo-result-value">🔥 {bestStreak}</div>
              <div className="geo-result-label">Лучшая серия</div>
            </div>
          </div>
          <p className="text-gray-600 text-base mt-4">{label}</p>
        </div>

        {/* Result map with markers */}
        <div className="glass rounded-2xl p-3 w-full shadow-sm">
          <ResultMap answered={answered} view={view} />
        </div>

        {answered.some(a => !a.correct) && (
          <div className="glass rounded-2xl p-6 w-full shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
              Ошибки ({answered.filter(a => !a.correct).length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {answered.filter(a => !a.correct).map((a, i) => (
                <div key={i} className="geo-mistake-row">
                  <span className="geo-mistake-country">
                    {a.country.flag} {a.country.name}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {a.timedOut ? (
                      <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg">
                        ⏱ время вышло
                      </span>
                    ) : a.clickedCode ? (
                      <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through">
                        {countryByCode(a.clickedCode)?.name ?? a.clickedCode}
                        {a.distanceKm > 0 && ` · ${formatKm(a.distanceKm)}`}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-md flex-wrap justify-center">
          {answered.some(a => !a.correct) && (
            <button
              onClick={replayMistakes}
              className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-500 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              🔁 Повторить ошибки
            </button>
          )}
          <button
            onClick={() => startGame()}
            className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            Настройки
          </button>
          <button
            onClick={onBack}
            className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  /* ─── Playing screen ─────────────────────────────────────────────────── */

  const q = questions[qIndex];
  const timePct = Math.max(0, Math.min(100, (timeLeft / QUESTION_TIME) * 100));
  const timerColor = timePct > 50 ? '#10b981' : timePct > 25 ? '#f59e0b' : '#ef4444';
  const correctCode = q.country.code;
  const correctM49 = ISO2_TO_M49[correctCode];
  const isDark = document.documentElement.dataset.theme === 'dark';
  const defaultFill = isDark ? 'rgba(75, 90, 130, 0.92)' : 'rgba(210, 220, 235, 0.92)';
  const defaultStroke = isDark ? 'rgba(100, 120, 170, 0.75)' : 'rgba(120, 130, 160, 0.6)';
  const hoverFill = isDark ? 'rgba(139, 92, 246, 0.65)' : 'rgba(139, 92, 246, 0.45)';
  const hoverStroke = isDark ? 'rgba(109, 40, 217, 0.9)' : 'rgba(109, 40, 217, 0.7)';

  return (
    <div className="geo-play geo-play--map animate-fade-in" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="geo-hud">
        <span className="geo-hud-item">Вопрос {qIndex + 1}/{questions.length}</span>
        <span className="geo-hud-item geo-hud-score">
          <AnimatePresence>
            {floatingPts && (
              <motion.span
                key={floatingPts.id}
                className="geo-floating-pts"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 1, 0], y: -40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
              >
                +{floatingPts.value}
              </motion.span>
            )}
          </AnimatePresence>
          {score} очк.
        </span>
        <span className={`geo-hud-item geo-hud-streak ${streak >= 3 ? 'geo-streak-hot' : ''}`}>
          🔥 {streak}
        </span>
      </div>

      <div className="geo-timer">
        <div className="geo-timer-bar" style={{ width: `${timePct}%`, background: timerColor }} />
      </div>

      <div className="geo-prompt">
        <span className="geo-prompt-flag">{q.country.flag}</span>
        <span className="geo-prompt-text">Где находится <b>{q.country.name}</b>?</span>
      </div>

      <div className="geo-map-wrap">
        <ComposableMap
          projectionConfig={{ scale: 160 }}
          projection={region === 'all' ? 'geoNaturalEarth1' : 'geoMercator'}
          width={1400}
          height={750}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={view.center} zoom={view.zoom}>
            <Geographies geography={TOPOJSON_URL}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; id: string }> }) =>
                geographies.map(geo => {
                  const iso = M49_TO_ISO2[String(geo.id)];
                  const isCorrect = geo.id === correctM49;
                  const isClicked = clicked?.code === iso && iso !== undefined;
                  const isHover = hoverCode === iso;

                  let fill = defaultFill;
                  let stroke = defaultStroke;
                  let strokeWidth = 0.5;

                  if (locked) {
                    if (isCorrect) { fill = 'rgba(34, 197, 94, 0.85)'; stroke = '#15803d'; strokeWidth = 0.8; }
                    else if (isClicked) { fill = 'rgba(239, 68, 68, 0.8)'; stroke = '#b91c1c'; strokeWidth = 0.8; }
                  } else if (isHover) {
                    fill = hoverFill;
                    stroke = hoverStroke;
                    strokeWidth = 0.7;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={(e: React.MouseEvent) => {
                        if (locked || !iso) return;
                        const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                        // approximate click coords — use country centroid for markers later
                        const country = iso ? countryByCode(iso) : null;
                        const coords: [number, number] | null = country
                          ? [country.lng, country.lat]
                          : [rect.left, rect.top];
                        handleAnswer(iso, coords);
                      }}
                      onMouseEnter={() => !locked && iso && setHoverCode(iso)}
                      onMouseLeave={() => setHoverCode(null)}
                      style={{
                        default: { fill, stroke, strokeWidth, outline: 'none', transition: 'fill 0.2s' },
                        hover:   { fill, stroke, strokeWidth, outline: 'none', cursor: locked ? 'default' : 'pointer' },
                        pressed: { fill, stroke, strokeWidth, outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Pulse marker on correct country when revealed */}
            {locked && (
              <Marker coordinates={[q.country.lng, q.country.lat]}>
                <circle r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} className="geo-pulse" />
              </Marker>
            )}
          </ZoomableGroup>
        </ComposableMap>

        {locked && !answered[answered.length - 1]?.correct && !answered[answered.length - 1]?.timedOut && (
          <div className="geo-missed-banner">
            Промах на <b>{formatKm(answered[answered.length - 1]?.distanceKm ?? 0)}</b>.
            Правильно: <b>{q.country.name}</b>
          </div>
        )}
        {locked && answered[answered.length - 1]?.timedOut && (
          <div className="geo-missed-banner">⏱ Время вышло. Это <b>{q.country.name}</b></div>
        )}
      </div>

      <button onClick={onBack} className="geo-back-link">← Выйти</button>
    </div>
  );
}

/* ─── Result map (small, all answers pinned) ─────────────────────────────── */

function ResultMap({
  answered, view,
}: {
  answered: Answered[];
  view: { center: [number, number]; zoom: number };
}) {
  return (
    <ComposableMap
      projectionConfig={{ scale: 160 }}
      projection="geoNaturalEarth1"
      width={900}
      height={420}
      style={{ width: '100%', height: 'auto' }}
    >
      <ZoomableGroup center={view.center} zoom={view.zoom}>
        <Geographies geography={TOPOJSON_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: 'rgba(210, 220, 240, 0.55)', stroke: 'rgba(120, 130, 160, 0.4)', strokeWidth: 0.3, outline: 'none' },
                  hover:   { fill: 'rgba(210, 220, 240, 0.55)', outline: 'none' },
                  pressed: { fill: 'rgba(210, 220, 240, 0.55)', outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {answered.map((a, i) => (
          <Marker key={i} coordinates={[a.country.lng, a.country.lat]}>
            <circle
              r={4}
              fill={a.correct ? '#22c55e' : '#ef4444'}
              stroke="#fff"
              strokeWidth={1.2}
              opacity={0.9}
            />
          </Marker>
        ))}
      </ZoomableGroup>
    </ComposableMap>
  );
}
