import { useEffect } from 'react';
import { useStreak } from '../contexts/StreakContext';

function dayWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

function headline(count: number, changed: string): string {
  if (changed === 'reset') return 'С возвращением!';
  if (changed === 'new') return 'Отличное начало!';
  if (count >= 30) return 'Железная дисциплина!';
  if (count >= 14) return 'Две недели подряд!';
  if (count >= 7) return 'Неделя подряд!';
  if (count >= 3) return 'Ты на волне!';
  return 'Молодец!';
}

function subtitle(changed: string): string {
  if (changed === 'reset') return 'Начинаем новую серию — и сегодня уже первый день.';
  if (changed === 'new') return 'Твоя первая звёздочка получена. Тренируйся каждый день, чтобы копить серию.';
  return 'Ты пришёл сегодня и продлил свою серию. Так держать!';
}

function bonusLabel(count: number, bonus: number): string {
  if (count % 7 === 0) return `+${bonus} очков — бонус за ${count} дней подряд! 🎉`;
  return `+${bonus} очков за сегодня`;
}

export default function DailyWelcome() {
  const { count, showWelcome, dismissWelcome, changed, bonusEarned } = useStreak();

  useEffect(() => {
    if (!showWelcome) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') dismissWelcome();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showWelcome, dismissWelcome]);

  if (!showWelcome) return null;

  // Render up to 7 stars in a row; for longer streaks show "+N" after 7.
  const maxStars = 7;
  const filled = Math.min(count, maxStars);
  const extra = count > maxStars ? count - maxStars : 0;

  return (
    <div className="welcome-overlay" onClick={dismissWelcome}>
      <div
        className="welcome-card animate-auth-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="welcome-glow" aria-hidden="true" />
        <div className="welcome-stars" aria-hidden="true">
          {Array.from({ length: filled }).map((_, i) => (
            <span
              key={i}
              className="welcome-star welcome-star-pop"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              ★
            </span>
          ))}
          {extra > 0 && <span className="welcome-star-extra">+{extra}</span>}
        </div>

        <h2 className="welcome-title">{headline(count, changed)}</h2>
        <div className="welcome-streak-line">
          <span className="welcome-streak-number">{count}</span>
          <span className="welcome-streak-label">{dayWord(count)} подряд</span>
        </div>
        <p className="welcome-subtitle">{subtitle(changed)}</p>

        {bonusEarned > 0 && (
          <div className="welcome-bonus">{bonusLabel(count, bonusEarned)}</div>
        )}

        <button className="welcome-button" onClick={dismissWelcome}>
          Начать тренировку
        </button>
      </div>
    </div>
  );
}
