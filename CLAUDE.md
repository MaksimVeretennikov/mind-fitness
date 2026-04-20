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

## Раздел «Кругозор» (география)
Два упражнения, общая база [countries.ts](src/data/countries.ts) (~170 стран):
`code`, `name`/`capital` (русские), `flag` (emoji), `region`, `difficulty`, `lat`/`lng`.

- **Где на карте?** — [GeographyMap.tsx](src/exercises/GeographyMap.tsx). Интерактивная SVG-карта
  на `react-simple-maps` + world-atlas 110m topojson (CDN). Клик по стране; таймер 15 сек;
  при ошибке — пульсирующая правильная страна + расстояние. Маппинг ISO-2 ↔ M49 numeric —
  [countryIds.ts](src/data/countryIds.ts). Слишком мелкие страны (Ватикан, Монако и т.п.)
  исключены через `SKIP_IN_MAP` — их нет в 110m.
- **Столицы мира** — [GeographyCapitals.tsx](src/exercises/GeographyCapitals.tsx). Два режима:
  `choice` (4 варианта, 12 сек, дистракторы из того же региона) и `input` (ручной ввод,
  20 сек, нечёткое сравнение с учётом диакритики и опечаток). Режим сохраняется в
  `localStorage["geo-capitals-mode"]`.

### Подсчёт очков (оба упражнения)
`base (100) + timeBonus (0..150) + streakMultiplier (1.0..2.0)`. Серия сбрасывается на
ошибке/таймауте. Плавающая анимация `+N` при правильном ответе.

### Хранение прогресса
- Сессии → общая таблица `exercise_results` через `saveResult()`. В `details`:
  `{ correct, total, errors, score, bestStreak, region, difficulty, mode?, timeSec, mistakes[] }`.
- Пер-страновой прогресс → отдельная таблица `geography_country_progress`
  (миграция [20260420_geography.sql](supabase/migrations/20260420_geography.sql)). RLS
  по `auth.uid() = user_id`. Работа через [geographyDB.ts](src/lib/geographyDB.ts):
  `updateCountryProgressBatch()` в конце сессии, `getWeakCountries()` — для режима
  «Повторить слабые страны».

### Зависимости
- `react-simple-maps@3` + `d3-geo` установлены с `--legacy-peer-deps` (peerDeps требуют
  React 18, но с React 19 всё работает).

## Правило обновления
После каждой значимой доработки (новая фича, рефакторинг, изменение архитектуры) —
обнови этот файл. Отражай актуальное состояние проекта, не историю изменений.
