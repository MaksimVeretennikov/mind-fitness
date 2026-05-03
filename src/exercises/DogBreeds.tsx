import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveResult } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { DOG_BREEDS, getBreedPhotoUrl, pickDistractors, type DogBreed } from '../data/dogBreeds';

type Phase = 'setup' | 'learning' | 'training' | 'result';
type ExerciseMode = 'learning' | 'training';

interface AnsweredBreed {
  breed: DogBreed;
  correct: boolean;
  chosen: string;
}

interface Props {
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ChoiceState {
  selected: string | null;
  correct: string | null; // revealed after wrong answer
}

interface TrainingQuestion {
  breed: DogBreed;
  choices: string[]; // pre-computed once, stable across renders
}

function buildQuestions(selectedBreeds: DogBreed[]): TrainingQuestion[] {
  const pool = selectedBreeds.length >= 10 ? selectedBreeds : DOG_BREEDS;
  return selectedBreeds.map(breed => ({
    breed,
    choices: shuffle([breed, ...pickDistractors(breed, pool, 3)]).map(b => b.nameRu),
  }));
}

export default function DogBreeds({ onBack }: Props) {
  const { user, setShowAuthModal } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<ExerciseMode>('learning');
  const [count, setCount] = useState(10);

  // session
  const [breeds, setBreeds] = useState<DogBreed[]>([]);
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<AnsweredBreed[]>([]);
  const [choice, setChoice] = useState<ChoiceState>({ selected: null, correct: null });
  const [locked, setLocked] = useState(false);
  const savedRef = useRef(false);

  const startSession = useCallback(
    (selectedBreeds: DogBreed[], startMode: ExerciseMode) => {
      setBreeds(selectedBreeds);
      setQuestions(buildQuestions(selectedBreeds));
      setIndex(0);
      setAnswered([]);
      setChoice({ selected: null, correct: null });
      setLocked(false);
      savedRef.current = false;
      setMode(startMode);
      setPhase(startMode);
    },
    [],
  );

  function handleStart() {
    const selected = shuffle(DOG_BREEDS).slice(0, count);
    startSession(selected, mode);
  }

  /* ─── Learning navigation ──────────────────────────────────────────────── */

  function learningNext() {
    if (index < breeds.length - 1) {
      setIndex(i => i + 1);
    }
  }

  function learningPrev() {
    if (index > 0) {
      setIndex(i => i - 1);
    }
  }

  function switchToTraining() {
    setQuestions(buildQuestions(breeds));
    setIndex(0);
    setAnswered([]);
    setChoice({ selected: null, correct: null });
    setLocked(false);
    savedRef.current = false;
    setPhase('training');
    setMode('training');
  }

  /* ─── Training answer handling ─────────────────────────────────────────── */

  function handleAnswer(chosen: string) {
    if (locked) return;
    const current = questions[index]?.breed ?? breeds[index];
    const isCorrect = chosen === current.nameRu;

    setLocked(true);

    if (isCorrect) {
      setChoice({ selected: chosen, correct: null });
      const newAnswered = [...answered, { breed: current, correct: true, chosen }];
      setAnswered(newAnswered);
      setTimeout(() => advanceTraining(newAnswered), 800);
    } else {
      setChoice({ selected: chosen, correct: current.nameRu });
      const newAnswered = [...answered, { breed: current, correct: false, chosen }];
      setAnswered(newAnswered);
      setTimeout(() => advanceTraining(newAnswered), 1500);
    }
  }

  function advanceTraining(currentAnswered: AnsweredBreed[]) {
    const next = index + 1;
    if (next >= breeds.length) {
      finishTraining(currentAnswered);
      return;
    }
    setIndex(next);
    setChoice({ selected: null, correct: null });
    setLocked(false);
  }

  function finishTraining(finalAnswered: AnsweredBreed[]) {
    if (savedRef.current) { setPhase('result'); return; }
    savedRef.current = true;

    const correctCount = finalAnswered.filter(a => a.correct).length;
    const total = finalAnswered.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const mistakes = finalAnswered
      .filter(a => !a.correct)
      .map(a => ({
        display: a.breed.nameRu,
        chosen: a.chosen,
        correct: a.breed.nameRu,
      }));

    saveResult('dog-breeds', scorePct, { correct: correctCount, total, mistakes });
    setPhase('result');
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Setup screen                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="glass rounded-3xl px-10 py-7 text-center shadow-sm w-full max-w-lg">
          <div className="text-5xl mb-4 animate-float">🐕</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Породы собак</h1>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Учись узнавать породы по фотографии
          </p>
        </div>

        <div className="glass rounded-2xl p-7 w-full max-w-lg shadow-sm flex flex-col gap-6">
          {/* Mode */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">
              Режим
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('learning')}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  mode === 'learning'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                    : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                }`}
              >
                📖 Обучение
              </button>
              <button
                onClick={() => setMode('training')}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  mode === 'training'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                    : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                }`}
              >
                🎯 Тренировка
              </button>
            </div>
          </div>

          {/* Count */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">
              Количество пород
            </p>
            <div className="flex gap-2 justify-center">
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Начать
          </button>

          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs text-gray-500 hover:text-amber-600 underline text-center"
            >
              Войдите, чтобы результаты тренировки сохранялись
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Learning screen                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  if (phase === 'learning') {
    const breed = breeds[index];
    const isLast = index === breeds.length - 1;

    return (
      <div className="flex flex-col items-center gap-5 px-4 py-6 animate-fade-in min-h-[70vh]">
        {/* Progress */}
        <div className="flex items-center gap-3 w-full max-w-4xl">
          <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${((index + 1) / breeds.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 shrink-0">
            {index + 1} / {breeds.length}
          </span>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={breed.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="glass rounded-3xl overflow-hidden shadow-lg w-full max-w-4xl"
          >
            {/* Photo */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <img
                src={getBreedPhotoUrl(breed.id)}
                alt={breed.nameRu}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {/* Name */}
            <div className="px-8 py-6 text-center">
              <h2 className="text-3xl font-bold text-gray-800">{breed.nameRu}</h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {index + 1} из {breeds.length}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 w-full max-w-4xl">
          <button
            onClick={learningPrev}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl text-sm font-semibold glass text-gray-600 hover:bg-white/80 transition-all active:scale-95 border border-white/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          {isLast ? (
            <button
              onClick={switchToTraining}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              🎯 Потренироваться
            </button>
          ) : (
            <button
              onClick={learningNext}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              Вперёд →
            </button>
          )}
        </div>

        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 underline">
          ← Выйти
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Training screen                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  if (phase === 'training') {
    const { breed, choices } = questions[index] ?? { breed: breeds[0], choices: [] };

    return (
      <div className="flex flex-col items-center gap-5 px-4 py-6 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center gap-3 w-full max-w-5xl">
          <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${((index) / breeds.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 shrink-0">
            {index + 1} / {breeds.length}
          </span>
        </div>

        {/* Main area — side by side on desktop */}
        <AnimatePresence mode="wait">
          <motion.div
            key={breed.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Photo */}
            <div className="glass rounded-3xl overflow-hidden shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                <img
                  src={getBreedPhotoUrl(breed.id)}
                  alt="Какая это порода?"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-sm font-semibold text-gray-500">Какая это порода?</p>
              </div>
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-3 justify-center">
              {choices.map(name => {
                const isSelected = choice.selected === name;
                const isRevealedCorrect = choice.correct === name;
                // selected and no wrong-answer reveal → user picked correctly
                const wasCorrectPick = isSelected && choice.correct === null;

                let cls =
                  'w-full py-4 px-5 rounded-2xl text-sm font-semibold text-left transition-all duration-200 border ';

                if (!choice.selected) {
                  cls += 'glass text-gray-700 hover:bg-white/80 border-white/60 active:scale-95 cursor-pointer';
                } else if (isRevealedCorrect || wasCorrectPick) {
                  cls += 'bg-emerald-100 text-emerald-700 border-emerald-300 cursor-default';
                } else if (isSelected) {
                  cls += 'bg-red-100 text-red-600 border-red-300 cursor-default';
                } else {
                  cls += 'bg-white/40 text-gray-400 border-white/40 cursor-default';
                }

                return (
                  <button
                    key={name}
                    onClick={() => handleAnswer(name)}
                    disabled={locked}
                    className={cls}
                  >
                    {(isRevealedCorrect || wasCorrectPick) && '✓ '}
                    {isSelected && !isRevealedCorrect && !wasCorrectPick && '✗ '}
                    {name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 underline">
          ← Выйти
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Result screen                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  const correctCount = answered.filter(a => a.correct).length;
  const total = answered.length;
  const accuracy = total > 0 ? correctCount / total : 0;
  const mistakes = answered.filter(a => !a.correct);

  const scoreColor =
    accuracy >= 0.8 ? 'text-emerald-600' : accuracy >= 0.5 ? 'text-amber-500' : 'text-red-500';
  const scoreLabel =
    accuracy >= 0.9
      ? 'Отлично! 🎉'
      : accuracy >= 0.7
      ? 'Хороший результат!'
      : accuracy >= 0.5
      ? 'Неплохо, но есть что улучшить.'
      : 'Стоит потренироваться ещё.';

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 animate-fade-in max-w-4xl mx-auto">
      {/* Score card */}
      <div className="glass rounded-2xl px-10 py-7 text-center shadow-sm w-full max-w-sm">
        <div className={`text-5xl font-bold mb-1 ${scoreColor}`}>
          {correctCount} из {total}
        </div>
        <p className="text-gray-500 text-sm uppercase tracking-wide mb-3">правильно</p>
        <p className="text-gray-600 text-base">{scoreLabel}</p>
      </div>

      {/* Mistakes */}
      {mistakes.length > 0 && (
        <div className="glass rounded-2xl p-6 w-full shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
            Ошибки ({mistakes.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mistakes.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl p-3 border border-white/60">
                <img
                  src={getBreedPhotoUrl(m.breed.id)}
                  alt={m.breed.nameRu}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Вы ответили:</p>
                  <p className="text-sm text-red-600 font-semibold line-through truncate">{m.chosen}</p>
                  <p className="text-sm text-emerald-600 font-semibold truncate">{m.breed.nameRu}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-md flex-wrap justify-center">
        {mistakes.length > 0 && (
          <button
            onClick={() => startSession(mistakes.map(m => m.breed), 'training')}
            className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-500 shadow-sm hover:opacity-90 transition-all active:scale-95"
          >
            🔁 Повторить ошибки
          </button>
        )}
        <button
          onClick={() => {
            const selected = shuffle(DOG_BREEDS).slice(0, count);
            startSession(selected, 'training');
          }}
          className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:opacity-90 transition-all active:scale-95"
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
