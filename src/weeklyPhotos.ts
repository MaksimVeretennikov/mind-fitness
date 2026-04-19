// Weekly nature photos, served as static assets from /public/bg.
// 7 days × 4 daytime periods = 28 unique nature landscapes.
// Files are produced by scripts/fetch-bg.mjs (runs in prebuild) — this keeps
// the background self-hosted so it loads reliably on networks that filter
// images.unsplash.com (e.g. some Russian ISPs without VPN).
// Evening & night use procedural gradients (see DynamicBackground) and are day-independent.

export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'sunset';
// JS getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS_RU: Record<DayIndex, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс',
};

export function getPhotoFor(day: DayIndex, period: DayPeriod): string {
  return `/bg/${day}-${period}.jpg`;
}
