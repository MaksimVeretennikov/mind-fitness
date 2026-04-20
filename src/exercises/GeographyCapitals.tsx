import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { updateCountryProgressBatch, getWeakCountries } from '../lib/geographyDB';
import { useAuth } from '../contexts/AuthContext';
import {
  COUNTRIES, REGIONS, filterCountries, countryByCode,
  type Country, type Region, type Difficulty,
} from '../data/countries';
import { pickResultLabel, toneToColor } from '../lib/resultLabels';
import './geography.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Phase = 'setup' | 'playing' | 'result';
type AnswerMode = 'choice' | 'input';
type DiffChoice = Difficulty | 'mixed';

interface Question {
  country: Country;
  choices: string[]; // only for 'choice' mode
}

interface Answered {
  country: Country;
  correct: boolean;
  given: string;      // what user chose/typed (or '' on timeout)
  timedOut: boolean;
}

interface Props {
  onBack: () => void;
}

const QUESTION_TIME_CHOICE = 12;
const QUESTION_TIME_INPUT = 20;
const MODE_STORAGE_KEY = 'geo-capitals-mode';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Levenshtein for "почти правильно"
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

function buildQuestions(pool: Country[], count: number): Question[] {
  const selected = shuffle(pool).slice(0, count);
  return selected.map(country => {
    // distractors: same region first, then global
    const sameRegion = COUNTRIES.filter(c => c.region === country.region && c.code !== country.code);
    const fallback = COUNTRIES.filter(c => c.code !== country.code);
    const pickFrom = sameRegion.length >= 3 ? sameRegion : fallback;
    const distractors = shuffle(pickFrom).slice(0, 3).map(c => c.capital);
    const choices = shuffle([country.capital, ...distractors]);
    return { country, choices };
  });
}

function calcScore(timeLeft: number, maxTime: number, streak: number): number {
  const timePct = timeLeft / maxTime;
  const speedBonus = timePct > 0.66 ? 5 : timePct > 0.33 ? 3 : 0;
  const streakBonus = streak >= 5 ? 3 : streak >= 3 ? 1 : 0;
  return 10 + speedBonus + streakBonus;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function GeographyCapitals({ onBack }: Props) {
  const { user, setShowAuthModal } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DiffChoice>('easy');
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<AnswerMode>(() => {
    return (localStorage.getItem(MODE_STORAGE_KEY) as AnswerMode) || 'choice';
  });
  const [weakCodes, setWeakCodes] = useState<string[] | null>(null);

  // playing state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_CHOICE);
  const [locked, setLocked] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<null | {
    kind: 'correct' | 'wrong' | 'close' | 'timeout';
    given: string;
    correct: string;
    scoreGained: number;
  }>(null);
  const [floatingPts, setFloatingPts] = useState<{ id: number; value: number } | null>(null);
  const [sessionStart, setSessionStart] = useState(0);

  const savedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pointIdRef = useRef(0);
  const answeredRef = useRef<Answered[]>([]);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);

  useEffect(() => { localStorage.setItem(MODE_STORAGE_KEY, mode); }, [mode]);

  // Load weak-country suggestions once user authenticated
  useEffect(() => {
    if (!user) { setWeakCodes([]); return; }
    getWeakCountries('capitals', 30, 2).then(codes => setWeakCodes(codes));
  }, [user]);

  const maxTime = mode === 'input' ? QUESTION_TIME_INPUT : QUESTION_TIME_CHOICE;

  const availablePool = useMemo(
    () => filterCountries(region, difficulty),
    [region, difficulty],
  );

  /* ─── Game control ───────────────────────────────────────────────────── */

  const startGame = useCallback((pool?: Country[]) => {
    const source = pool ?? availablePool;
    if (source.length === 0) return;
    const qs = buildQuestions(source, Math.min(count, source.length));
    setQuestions(qs);
    setQIndex(0);
    setAnswered([]);
    answeredRef.current = [];
    scoreRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(mode === 'input' ? QUESTION_TIME_INPUT : QUESTION_TIME_CHOICE);
    setLocked(false);
    setInput('');
    setFeedback(null);
    setSessionStart(Date.now());
    savedRef.current = false;
    setPhase('playing');
  }, [availablePool, count, mode]);

  const replayWeak = useCallback(() => {
    if (!weakCodes || weakCodes.length === 0) return;
    const pool = weakCodes.map(countryByCode).filter((c): c is Country => !!c);
    if (pool.length === 0) return;
    startGame(pool);
  }, [weakCodes, startGame]);

  const replayMistakes = useCallback(() => {
    const mistakesCountries = answered.filter(a => !a.correct).map(a => a.country);
    if (mistakesCountries.length === 0) return;
    startGame(mistakesCountries);
  }, [answered, startGame]);

  /* ─── Timer ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (phase !== 'playing' || locked) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 0.1), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, locked]);

  useEffect(() => {
    if (phase === 'playing' && mode === 'input' && !locked) {
      inputRef.current?.focus();
    }
  }, [qIndex, phase, mode, locked]);

  /* ─── Answer handling ────────────────────────────────────────────────── */

  function handleAnswer(given: string | null) {
    if (locked || phase !== 'playing') return;
    setLocked(true);

    const q = questions[qIndex];
    const normCorrect = normalize(q.country.capital);
    const normGiven = given === null ? '' : normalize(given);
    const isTimeout = given === null;
    let kind: 'correct' | 'wrong' | 'close' | 'timeout';
    let isCorrect = false;

    if (isTimeout) {
      kind = 'timeout';
    } else if (normGiven === normCorrect) {
      kind = 'correct';
      isCorrect = true;
    } else if (mode === 'input' && editDistance(normGiven, normCorrect) <= Math.max(1, Math.floor(normCorrect.length / 7))) {
      kind = 'close';
    } else {
      kind = 'wrong';
    }

    let gained = 0;
    if (isCorrect) {
      gained = calcScore(timeLeft, maxTime, streakRef.current);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      if (newStreak > bestStreakRef.current) bestStreakRef.current = newStreak;
      setBestStreak(bestStreakRef.current);
      pointIdRef.current += 1;
      setFloatingPts({ id: pointIdRef.current, value: gained });
      setTimeout(() => setFloatingPts(null), 900);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }

    setFeedback({
      kind,
      given: given ?? '',
      correct: q.country.capital,
      scoreGained: gained,
    });
    const newItem: Answered = {
      country: q.country,
      correct: isCorrect,
      given: given ?? '',
      timedOut: isTimeout,
    };
    answeredRef.current = [...answeredRef.current, newItem];
    setAnswered(answeredRef.current);

    const delay = kind === 'correct' ? 800 : kind === 'close' ? 1600 : 1400;
    setTimeout(() => advance(), delay);
  }

  function advance() {
    const next = qIndex + 1;
    if (next >= questions.length) {
      finish();
      return;
    }
    setQIndex(next);
    setInput('');
    setFeedback(null);
    setLocked(false);
    setTimeLeft(maxTime);
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
        chosen: a.timedOut ? '⏱ время вышло' : (a.given || '—'),
        correct: a.country.capital,
      }));

    saveResult('geography-capitals', scorePct, {
      correct: correctCount,
      total,
      errors: total - correctCount,
      score: finalScore,
      bestStreak: finalBestStreak,
      region,
      difficulty,
      mode,
      timeSec,
      mistakes,
    });

    updateCountryProgressBatch('capitals', finalAnswered.map(a => ({
      countryCode: a.country.code,
      correct: a.correct,
    })));

    setPhase('result');
  }

  /* ─── UI helpers ─────────────────────────────────────────────────────── */

  const poolCount = availablePool.length;
  const actualCount = Math.min(count, poolCount);

  /* ─── Setup screen ───────────────────────────────────────────────────── */

  if (phase === 'setup') {
    return (
      <div className="geo-setup animate-fade-in">
        <div className="glass rounded-3xl px-10 py-7 text-center shadow-sm geo-setup-header">
          <div className="text-5xl mb-4 animate-float">🏛️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Столицы мира</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Угадай столицу по флагу и названию страны
          </p>
        </div>

        <div className="glass rounded-2xl p-7 w-full max-w-2xl shadow-sm flex flex-col gap-6">
          {/* Region */}
          <div>
            <p className="geo-label">Регион</p>
            <div className="geo-pills">
              {REGIONS.map(r => {
                const c = COUNTRIES.filter(co => r.id === 'all' || co.region === r.id).length;
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

          {/* Difficulty */}
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

          {/* Mode */}
          <div>
            <p className="geo-label">Режим ответа</p>
            <div className="geo-toggle">
              <button
                onClick={() => setMode('choice')}
                className={`geo-toggle-btn ${mode === 'choice' ? 'geo-toggle-btn--active' : ''}`}
              >
                🎯 Из вариантов
              </button>
              <button
                onClick={() => setMode('input')}
                className={`geo-toggle-btn ${mode === 'input' ? 'geo-toggle-btn--active' : ''}`}
              >
                ⌨️ Написать
              </button>
            </div>
          </div>

          {/* Count */}
          <div>
            <p className="geo-label">Количество вопросов</p>
            <div className="flex gap-2 justify-center">
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="geo-pool-info">
            {poolCount === 0
              ? 'В этом регионе и сложности нет стран — измените параметры.'
              : `Доступно стран: ${poolCount}. Будет задано: ${actualCount}`}
          </div>

          <button
            onClick={() => startGame()}
            disabled={poolCount === 0}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Начать
          </button>

          {weakCodes && weakCodes.length > 0 && (
            <button
              onClick={replayWeak}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-teal-700 glass hover:bg-white/80 transition-all active:scale-95 border border-teal-200"
            >
              🔁 Повторить слабые страны ({weakCodes.length})
            </button>
          )}

          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs text-gray-500 hover:text-teal-600 underline"
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
    const mistakes = answered.filter(a => !a.correct);

    return (
      <div className="geo-result flex flex-col items-center gap-6 py-8 animate-fade-in max-w-2xl mx-auto px-4">
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

        {mistakes.length > 0 && (
          <div className="glass rounded-2xl p-6 w-full shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
              Ошибки ({mistakes.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {mistakes.map((m, i) => (
                <div key={i} className="geo-mistake-row">
                  <span className="geo-mistake-country">
                    {m.country.flag} {m.country.name}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through">
                      {m.timedOut ? '⏱ время вышло' : (m.given || '—')}
                    </span>
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {m.country.capital}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-md flex-wrap justify-center">
          {mistakes.length > 0 && (
            <button
              onClick={replayMistakes}
              className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-500 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              🔁 Повторить ошибки
            </button>
          )}
          <button
            onClick={() => startGame()}
            className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
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
  const timePct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const timerColor = timePct > 50 ? '#10b981' : timePct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="geo-play animate-fade-in">
      {/* HUD */}
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

      {/* Timer */}
      <div className="geo-timer">
        <div
          className="geo-timer-bar"
          style={{ width: `${timePct}%`, background: timerColor }}
        />
      </div>

      {/* Question card */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="glass rounded-2xl p-8 w-full max-w-md shadow-sm text-center"
      >
        <div className="geo-flag">{q.country.flag}</div>
        <h2 className="text-3xl font-bold text-gray-800 mt-3 mb-1">{q.country.name}</h2>
        <p className="text-gray-500 text-sm">Какая столица этой страны?</p>
      </motion.div>

      {/* Answer zone */}
      {mode === 'choice' ? (
        <div className="geo-choices">
          {q.choices.map(choice => {
            const chosen = feedback?.given === choice;
            const isCorrectChoice = choice === q.country.capital;
            let stateCls = '';
            if (feedback) {
              if (isCorrectChoice) stateCls = 'geo-choice--correct';
              else if (chosen) stateCls = 'geo-choice--wrong';
              else stateCls = 'geo-choice--dim';
            }
            return (
              <button
                key={choice}
                onClick={() => !locked && handleAnswer(choice)}
                disabled={locked}
                className={`geo-choice ${stateCls}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="geo-input-wrap">
          <form
            onSubmit={e => { e.preventDefault(); if (!locked && input.trim()) handleAnswer(input); }}
            className="flex gap-2 w-full"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={locked}
              placeholder="Введите столицу..."
              className="geo-input"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={locked || !input.trim()}
              className="geo-input-submit"
            >
              ⏎
            </button>
          </form>
          {feedback && (
            <div className={`geo-feedback geo-feedback--${feedback.kind}`}>
              {feedback.kind === 'correct' && <>✓ Правильно! +{feedback.scoreGained} очк.</>}
              {feedback.kind === 'close' && <>Почти! Правильно: <b>{feedback.correct}</b></>}
              {feedback.kind === 'wrong' && <>Ответ: <b>{feedback.correct}</b></>}
              {feedback.kind === 'timeout' && <>⏱ Время вышло. Ответ: <b>{feedback.correct}</b></>}
            </div>
          )}
        </div>
      )}

      <button onClick={onBack} className="geo-back-link">← Выйти</button>
    </div>
  );
}
