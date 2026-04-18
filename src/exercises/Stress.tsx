import { useState, useMemo } from 'react';
import ChoiceQuiz, { type QuizItem } from './ChoiceQuiz';
import { STRESS_ITEMS } from './stressData';

interface Props {
  onBack: () => void;
}

function renderStress(word: string) {
  const chars = [...word];
  return (
    <span>
      {chars.map((ch, i) => {
        const isUpper = ch !== ch.toLowerCase() && ch === ch.toUpperCase();
        if (isUpper) {
          return (
            <span key={i} className="underline underline-offset-4 decoration-2 font-extrabold">
              {ch.toLowerCase()}
            </span>
          );
        }
        return <span key={i}>{ch}</span>;
      })}
    </span>
  );
}

export default function Stress({ onBack }: Props) {
  const [count, setCount] = useState(10);

  const pool = useMemo<QuizItem[]>(
    () =>
      STRESS_ITEMS.map((it) => ({
        display: it.plain,
        correct: it.correct,
        wrong: it.wrong,
        correctLabel: renderStress(it.correct),
        wrongLabel: renderStress(it.wrong),
      })),
    [],
  );

  return (
    <ChoiceQuiz
      pool={pool}
      resultKey="stress"
      title="Ударение"
      emoji="🔊"
      subtitle="Выберите вариант с правильным ударением"
      count={count}
      onCountChange={setCount}
      onBack={onBack}
    />
  );
}
