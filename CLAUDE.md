# Mind Fitness — Claude Code Instructions

## Git workflow
- Remote: https://github.com/MaksimVeretennikov/mind-fitness
- Authentication: Personal Access Token (already configured in remote URL)
- Vercel auto-deploys on every push to main
- Always work in feature branches, merge to main only after approval

### Branch workflow
1. Create a new branch: `git checkout -b feature/feature-name`
2. Make changes and commit regularly
3. Push the branch: `git push -u origin feature/feature-name`
4. After approval, merge into main: `git checkout main && git merge feature/feature-name && git push origin main`
5. Never commit directly to main

## Current status
- Project is live on Vercel at mind-fitness.vercel.app
- Git push is working correctly

## Theme system
The app renders a dynamic background that reflects both the current **hour** and the
current **day of the week**.

- Time-of-day slots (see [DynamicBackground.tsx](src/components/DynamicBackground.tsx)):
  - `night`     — 21:00–05:00 → procedural dark gradient + starfield (day-independent)
  - `dawn`      — 05:00–08:00 → weekly photo
  - `morning`   — 08:00–12:00 → weekly photo
  - `afternoon` — 12:00–17:00 → weekly photo
  - `sunset`    — 17:00–19:00 → weekly photo
  - `evening`   — 19:00–21:00 → procedural dusk gradient + starfield (day-independent)

- Weekly nature photos ([weeklyPhotos.ts](src/weeklyPhotos.ts)):
  - 7 days × 4 daytime slots = 28 unique Unsplash CDN images.
  - Every photo is a real nature landscape (mountains, forests, lakes, ocean, fields) —
    no studio shots, no animal/object close-ups.
  - Photos are visually curated per period: dawn = soft pastels & pre-sunrise tones,
    morning = bright cool daylight, afternoon = saturated midday, sunset = warm golds/reds.
  - Evening & night are **the same for every day** — only the 4 daytime slots rotate weekly.
  - Day is resolved via `new Date().getDay()` (0 = Sunday … 6 = Saturday).
  - URLs use `images.unsplash.com/photo-{id}` — no API key.

- Readability:
  - Section headers ("Когнитивные тренажёры", "Русский язык") sit directly on the photo,
    so they reuse the same `.glass rounded-2xl shadow-sm p-6` pattern as the exercise
    cards. This keeps the visual language consistent and preserves text legibility
    on any landscape.

- Dev panel ([DevTimePanel.tsx](src/components/DevTimePanel.tsx)):
  - Rendered only in `import.meta.env.DEV`.
  - Top row: 6 time-of-day buttons (Ночь / Рассвет / Утро / День / Закат / Вечер).
  - Bottom row: 7 day buttons (Пн…Вс). Click-to-toggle: second click clears the override.
  - Overrides flow into `DynamicBackground` via `hourOverride` / `dayOverride` props, so
    the UI reflects each of the 28 combinations instantly for manual QA.

## Правило обновления
После каждой значимой доработки (новая фича, рефакторинг, изменение архитектуры) —
обнови этот файл. Отражай актуальное состояние проекта, не историю изменений.
