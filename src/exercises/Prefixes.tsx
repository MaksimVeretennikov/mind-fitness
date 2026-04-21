import { useState, useMemo } from 'react';
import ChoiceQuiz, { type QuizItem } from './ChoiceQuiz';
import {
  getPrefixPool,
  PREFIX_CATEGORY_LABELS,
  type PrefixCategory,
} from './prefixesData';

interface Props {
  onBack: () => void;
}

const CATEGORIES: PrefixCategory[] = ['unchanged', 'preEpri', 'zs', 'iy', 'yer', 'mixed'];

export default function Prefixes({ onBack }: Props) {
  const [count, setCount] = useState(10);
  const [category, setCategory] = useState<PrefixCategory>('mixed');

  const pool = useMemo<QuizItem[]>(
    () =>
      getPrefixPool(category).map((p) => ({
        display: p.display,
        correct: p.correct,
        wrong: p.wrong,
      })),
    [category],
  );

  const setupExtras = (
    <div>
      <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
        Тип приставки
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold text-left transition-all duration-200 active:scale-95 ${
              category === cat
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
            }`}
          >
            {PREFIX_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ChoiceQuiz
      pool={pool}
      resultKey="prefixes"
      title="Правописание приставок"
      emoji="✍️"
      subtitle="Выберите правильное написание буквы на месте пропуска"
      count={count}
      onCountChange={setCount}
      setupExtras={setupExtras}
      onBack={onBack}
    />
  );
}
