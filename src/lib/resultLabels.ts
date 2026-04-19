export type ResultTone = 'great' | 'warn';

export interface ResultLabel {
  label: string;
  tone: ResultTone;
}

// Picked once per result (callers memoize on score), so variants don't flicker
// on re-render but change between attempts.
const TIERS: ReadonlyArray<{ min: number; tone: ResultTone; labels: readonly string[] }> = [
  {
    min: 0.9,
    tone: 'great',
    labels: [
      '🎉 Отлично!',
      '🏆 Ты просто мастер!',
      '🔥 Это было огонь!',
      '🚀 На космической скорости!',
      '👑 Корону заслужил',
    ],
  },
  {
    min: 0.8,
    tone: 'great',
    labels: [
      '✨ Хороший результат',
      '🎯 Почти в яблочко',
      '💫 Солидно!',
      '🌟 Крепкая пятёрка',
      '😎 Знание — сила',
    ],
  },
  {
    min: 0.65,
    tone: 'warn',
    labels: [
      '🙂 Неплохо',
      '🧠 Мозг в тонусе',
      '☕ Ещё пара чашек кофе — и будет отлично',
      '📈 Уверенный прогресс',
      '🎲 Где-то повезло, где-то знал',
    ],
  },
  {
    min: 0.5,
    tone: 'warn',
    labels: [
      '💪 Есть над чем поработать',
      '🛠️ Время для тренировки',
      '🐢 Не спеша, но вперёд',
      '🎢 То густо, то пусто',
      '🧗 Подъём продолжается',
    ],
  },
  {
    min: 0,
    tone: 'warn',
    labels: [
      '📚 Стоит повторить тему',
      '🛌 Похоже, мозг ещё спит',
      '🌧 День не задался — попробуй ещё',
      '🧩 Пазл пока не сходится',
      '🎭 Сегодня не твой день — завтра лучше',
    ],
  },
];

export function pickResultLabel(pct: number): ResultLabel {
  const tier = TIERS.find(t => pct >= t.min) ?? TIERS[TIERS.length - 1];
  const label = tier.labels[Math.floor(Math.random() * tier.labels.length)];
  return { label, tone: tier.tone };
}

export function toneToColor(tone: ResultTone): string {
  return tone === 'great' ? 'text-emerald-600' : 'text-amber-500';
}
