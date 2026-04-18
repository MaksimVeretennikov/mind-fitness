import { useStreak } from '../contexts/StreakContext';

function dayWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

export default function StreakBadge() {
  const { count, best } = useStreak();
  if (!count) return null;

  const title = best > count
    ? `Серия: ${count} ${dayWord(count)} подряд · рекорд ${best}`
    : `Серия: ${count} ${dayWord(count)} подряд`;

  return (
    <div className="streak-badge" title={title} aria-label={title}>
      <span className="streak-badge-star" aria-hidden="true">★</span>
      <span className="streak-badge-count">{count}</span>
    </div>
  );
}
