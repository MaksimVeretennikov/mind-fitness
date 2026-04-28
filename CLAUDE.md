# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. 
Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. 
For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" 
If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it. Don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. 
Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, 
fewer rewrites due to overcomplication, and clarifying questions come 
before implementation rather than after mistakes.

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

## Система очков (total_score)

Единое поле `streaks.total_score` хранит накопленные очки по русскому языку.

- **Начисление за упражнения:** `saveResult()` в [auth.ts](src/lib/auth.ts) принимает
  необязательный `ruScore?: number`. Все 9 русских упражнений (adverbs, prefixes,
  spelling-nn, word-forms, stress, abbreviations, verb-suffixes, root-spelling,
  suffix-spelling) передают `correct * 10`. Внутри
  вызывается `incrementTotalScore()` → RPC `increment_total_score(user_id, delta)`.
- **Бонус за заход:** при первом визите за день `StreakContext` вызывает
  `incrementTotalScore(userId, loginBonus(count))`. Формула: обычный день = +50,
  каждый 7-й день = +150/200/250/… (+50 за каждую следующую 7-дневку).
  `loginBonus(count)` = `count % 7 === 0 ? 50 * (2 + count/7) : 50`.
- **Отображение:** `UserBadge` загружает `streaks.total_score` для текущего
  пользователя и показывает ⭐ N очков в дропдауне профиля.
- **DailyWelcome** показывает плашку «+N очков» при каждом новом дне (включая
  7-дневный миниюбилей с праздничным текстом).

### RPC-функции (все SECURITY DEFINER, обходят RLS)
- `increment_total_score(p_user_id, p_delta)` — атомарный UPSERT, вызывается клиентом
- `get_member_meta(p_group_id)` — возвращает `user_id, total_score, last_login` по членам
  группы для учителя (обходит RLS таблицы streaks)
- `get_group_ranking(p_group_id)` — возвращает `user_id, display_name, total_score`
  для рейтинга; доступен членам группы и владельцу

### Бэкфилл и миграции
- [20260426_total_score.sql](supabase/migrations/20260426_total_score.sql): добавляет
  колонку `total_score`, бэкфилл из `exercise_results`, создаёт `increment_total_score`
  и новую версию `get_group_ranking`.
- [20260426_member_meta_rpc.sql](supabase/migrations/20260426_member_meta_rpc.sql):
  создаёт `get_member_meta`.
- Если пользователь сделал упражнения до миграции и у него нет строки в `streaks`:
  ```sql
  INSERT INTO streaks (user_id, count, best, last_visit, updated_at, total_score)
  SELECT er.user_id, 1, 1, CURRENT_DATE, NOW(),
         SUM(COALESCE((er.details->>'correct')::int, 0) * 10)
  FROM exercise_results er
  WHERE er.exercise_name IN ('adverbs','prefixes','spelling-nn','word-forms','stress','abbreviations')
    AND er.user_id NOT IN (SELECT user_id FROM streaks)
  GROUP BY er.user_id HAVING SUM(...) > 0
  ON CONFLICT (user_id) DO NOTHING;
  ```
- Перезагрузка схемы PostgREST после изменения RPC: `NOTIFY pgrst, 'reload schema';`

## Дашборд учителя (ленивая загрузка)

[TeacherDashboard.tsx](src/components/TeacherDashboard.tsx) загружает данные поэтапно:
1. **При открытии:** `getGroupMembers` + `getMemberMeta` (два лёгких запроса).
   Сайдбар показывает имя, время последнего логина (из `streaks.updated_at`), очки.
2. **При клике на ученика:** `getResultsForUser(userId, offset, 50)` — 50 попыток за раз.
   Результаты кэшируются в Map на время сессии. Кнопка «Загрузить ещё из базы».

В [groupsDB.ts](src/lib/groupsDB.ts):
- `getMemberMeta(groupId)` → RPC `get_member_meta`
- `getResultsForUser(userId, offset, limit)` → прямой запрос к `exercise_results`
- `getGroupRankingDirect(groupId)` → строит рейтинг из `getMemberMeta` (не через RPC
  рейтинга, чтобы обойти возможные проблемы с кэшем схемы PostgREST)

## Текстовые упражнения по вводу (TextInputExercise)

Три новых упражнения используют общий компонент [TextInputExercise.tsx](src/exercises/TextInputExercise.tsx)
вместо `ChoiceQuiz`. Пользователь видит слово/словосочетание с пропуском (`_`) и вводит
правильную форму целиком в текстовое поле.

- **Суффиксы глаголов и причастий** (`verb-suffixes`) — 64 слова, [VerbSuffixes.tsx](src/exercises/VerbSuffixes.tsx)
- **Правописание корней** (`root-spelling`) — 52 слова, [RootSpelling.tsx](src/exercises/RootSpelling.tsx)
- **Правописание суффиксов** (`suffix-spelling`) — 62 слова, [SuffixSpelling.tsx](src/exercises/SuffixSpelling.tsx)

Интерфейс `TextItem`: `{ display: string; answer: string }` — `display` показывает
словосочетание с пропуском, `answer` — только то слово, которое нужно ввести.

Сравнение регистронезависимое (`toLowerCase()`). При правильном ответе — зелёная карточка
+ анимация вправо. При ошибке — красная карточка + дрожание + показ правильного ответа +
анимация вниз. Хранение ошибок, история (`MistakesHistory`) и «Работа над ошибками»
(`ErrorDrill`) — по той же схеме, что и в `Adverbs`.

## Правило обновления
После каждой значимой доработки (новая фича, рефакторинг, изменение архитектуры) —
обнови этот файл. Отражай актуальное состояние проекта, не историю изменений.
