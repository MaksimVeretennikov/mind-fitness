import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroup } from '../contexts/GroupContext';
import {
  getGroupMembers,
  getResultsForUsers,
  type GroupMember,
  type ExerciseResult,
} from '../lib/groupsDB';

const EXERCISE_NAMES: Record<string, string> = {
  munsterberg: 'Тест Мюнстерберга',
  philwords: 'Филворды',
  schulte: 'Зоркий глаз',
  sequence: 'Последовательности',
  pairs: 'Игра на пары',
  balls: 'Шарики с номерами',
  reaction: 'Реакция на шарик',
  adverbs: 'Наречия',
  prefixes: 'Приставки',
  'spelling-nn': 'Н и НН',
  'word-forms': 'Формы слова',
  stress: 'Ударение',
  abbreviations: 'Аббревиатуры',
  'geography-map': 'Где на карте?',
  'geography-capitals': 'Столицы мира',
};

const EXERCISE_ICONS: Record<string, string> = {
  adverbs: '📝', prefixes: '✍️', 'spelling-nn': '✏️',
  'word-forms': '📚', stress: '🔊', abbreviations: '🔤',
  munsterberg: '🔍', philwords: '📝', schulte: '👁️',
  sequence: '🧠', pairs: '🃏', balls: '🎯', reaction: '⚡',
  'geography-map': '🗺️', 'geography-capitals': '🏛️',
};

const RU_EXERCISES = new Set([
  'adverbs', 'prefixes', 'spelling-nn', 'word-forms', 'stress', 'abbreviations',
]);

const HISTORY_PAGE_SIZE = 15;

interface ChoiceMistake { display: string; chosen: string; correct: string }
interface AbbrMistake { abbr: string; full: string }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function studentLabel(m: GroupMember): string {
  return m.display_name?.trim() || m.email || 'Без имени';
}

function studentInitial(m: GroupMember): string {
  const label = studentLabel(m);
  return label[0]?.toUpperCase() ?? '?';
}

export default function TeacherDashboard() {
  const { showTeacherDashboard, setShowTeacherDashboard, ownedGroup } = useGroup();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // History state
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);

  // Errors section: collapsible per exercise
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedAttempts(new Set());
    setHistoryFilter(null);
    setHistoryLimit(HISTORY_PAGE_SIZE);
    setExpandedExercises(new Set());
  }, [selectedId]);

  function toggleAttempt(id: string) {
    setExpandedAttempts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleExercise(ex: string) {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(ex)) next.delete(ex); else next.add(ex);
      return next;
    });
  }

  function renderAttemptMistakes(r: ExerciseResult) {
    const raw = (r.details as { mistakes?: unknown })?.mistakes;
    if (!Array.isArray(raw) || raw.length === 0) {
      return (
        <div className="dashboard-attempt-empty">
          {r.exercise_name === 'abbreviations' ? '🎉 Все аббревиатуры знал' : '🎉 Без ошибок'}
        </div>
      );
    }
    if (r.exercise_name === 'abbreviations') {
      const list = raw as AbbrMistake[];
      return (
        <div className="dashboard-attempt-mistakes">
          {list.map((m, i) => (
            <div key={i} className="dashboard-mistake-row">
              <span className="dashboard-mistake-display" style={{ fontWeight: 700 }}>{m.abbr}</span>
              <span className="dashboard-mistake-correct">{m.full}</span>
            </div>
          ))}
        </div>
      );
    }
    const list = raw as ChoiceMistake[];
    return (
      <div className="dashboard-attempt-mistakes">
        {list.map((m, i) => (
          <div key={i} className="dashboard-mistake-row">
            <span className="dashboard-mistake-display">{m.display}</span>
            <div className="dashboard-mistake-right">
              <span style={{ color: '#dc2626', textDecoration: 'line-through', fontSize: '0.82rem' }}>{m.chosen}</span>
              <span className="dashboard-mistake-correct">{m.correct}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    if (!showTeacherDashboard || !ownedGroup) return;
    setLoading(true);
    (async () => {
      const ms = await getGroupMembers(ownedGroup.id);
      setMembers(ms);
      const userIds = ms.map((m) => m.user_id);
      const rs = await getResultsForUsers(userIds);
      setResults(rs);
      setLoading(false);
    })();
  }, [showTeacherDashboard, ownedGroup]);

  const resultsByUser = useMemo(() => {
    const map = new Map<string, ExerciseResult[]>();
    for (const r of results) {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r);
      map.set(r.user_id, arr);
    }
    return map;
  }, [results]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  function ruErrorsLast7d(userId: string): number {
    const arr = resultsByUser.get(userId) ?? [];
    let count = 0;
    for (const r of arr) {
      if (!RU_EXERCISES.has(r.exercise_name)) continue;
      if (new Date(r.created_at).getTime() < weekAgo) continue;
      const ms = (r.details as { mistakes?: unknown })?.mistakes;
      if (Array.isArray(ms)) count += ms.length;
    }
    return count;
  }

  function ruTotalScore(userId: string): number {
    const arr = resultsByUser.get(userId) ?? [];
    let sum = 0;
    for (const r of arr) {
      if (!RU_EXERCISES.has(r.exercise_name)) continue;
      sum += (Number((r.details as { correct?: number })?.correct) || 0) * 10;
    }
    return sum;
  }

  function lastActivity(userId: string): string | null {
    const arr = resultsByUser.get(userId) ?? [];
    if (arr.length === 0) return null;
    return arr[0].created_at;
  }

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? members.filter((m) => studentLabel(m).toLowerCase().includes(q))
      : members;
    return [...list].sort((a, b) => {
      const la = lastActivity(a.user_id);
      const lb = lastActivity(b.user_id);
      if (!la && !lb) return studentLabel(a).localeCompare(studentLabel(b));
      if (!la) return 1;
      if (!lb) return -1;
      return new Date(lb).getTime() - new Date(la).getTime();
    });
  }, [members, search, resultsByUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMember = members.find((m) => m.user_id === selectedId) ?? null;
  const selectedResults = selectedId ? resultsByUser.get(selectedId) ?? [] : [];

  const aggregatedMistakes = useMemo(() => {
    const byExercise = new Map<
      string,
      Map<string, { display: string; correct: string; chosen?: string; count: number; isAbbr: boolean }>
    >();
    for (const r of selectedResults) {
      if (!RU_EXERCISES.has(r.exercise_name)) continue;
      const raw = (r.details as { mistakes?: unknown })?.mistakes;
      if (!Array.isArray(raw)) continue;
      const isAbbr = r.exercise_name === 'abbreviations';
      const inner = byExercise.get(r.exercise_name) ?? new Map();
      for (const m of raw) {
        if (isAbbr) {
          const mm = m as AbbrMistake;
          if (!mm?.abbr) continue;
          const key = `${mm.abbr}|${mm.full}`;
          const prev = inner.get(key);
          if (prev) prev.count += 1;
          else inner.set(key, { display: mm.abbr, correct: mm.full, count: 1, isAbbr: true });
        } else {
          const mm = m as ChoiceMistake;
          if (!mm?.display) continue;
          const key = `${mm.display}|${mm.correct}`;
          const prev = inner.get(key);
          if (prev) prev.count += 1;
          else inner.set(key, { display: mm.display, correct: mm.correct, chosen: mm.chosen, count: 1, isAbbr: false });
        }
      }
      byExercise.set(r.exercise_name, inner);
    }
    return Array.from(byExercise.entries()).map(([ex, inner]) => ({
      exercise: ex,
      mistakes: Array.from(inner.values()).sort((a, b) => b.count - a.count),
    }));
  }, [selectedResults]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyGroup(exercise: string, side: 'left' | 'right', mistakes: typeof aggregatedMistakes[number]['mistakes']) {
    const text = mistakes
      .map((m) => {
        const val = side === 'left' ? m.display : m.correct;
        return `${val}${m.count > 1 ? ` (×${m.count})` : ''}`;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      const key = `${exercise}|${side}`;
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      /* ignore */
    }
  }

  // History: filter by exercise + pagination
  const historyExercises = useMemo(() => {
    const seen = new Set<string>();
    for (const r of selectedResults) seen.add(r.exercise_name);
    return Array.from(seen);
  }, [selectedResults]);

  const filteredHistory = useMemo(() => {
    return historyFilter
      ? selectedResults.filter((r) => r.exercise_name === historyFilter)
      : selectedResults;
  }, [selectedResults, historyFilter]);

  const visibleHistory = filteredHistory.slice(0, historyLimit);
  const hasMore = filteredHistory.length > historyLimit;

  if (!showTeacherDashboard || !ownedGroup) return null;

  return createPortal(
    <>
      <div className="dashboard-backdrop" />
      <div
        className="dashboard-wrap"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowTeacherDashboard(false);
        }}
      >
        <div className="dashboard" onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-header">
            <div className="dashboard-title-block">
              <h2>{ownedGroup.name}</h2>
              <div className="dashboard-subtitle">
                {members.length}{' '}
                {members.length === 1 ? 'ученик' : members.length < 5 ? 'ученика' : 'учеников'}
              </div>
              <div className="dashboard-code-chip">🔑 {ownedGroup.code}</div>
            </div>
            <button
              className="dashboard-close"
              onClick={() => setShowTeacherDashboard(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className={`dashboard-body${selectedId ? ' has-selection' : ''}`}>
            <div className="dashboard-sidebar">
              <div className="dashboard-search">
                <input
                  placeholder="Поиск ученика…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="dashboard-students">
                {loading ? (
                  <div className="dashboard-empty">Загрузка…</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="dashboard-empty">
                    {members.length === 0
                      ? 'Пока нет учеников. Поделитесь кодом группы.'
                      : 'Никого не найдено'}
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const errs = ruErrorsLast7d(m.user_id);
                    const last = lastActivity(m.user_id);
                    return (
                      <button
                        key={m.user_id}
                        className={`dashboard-student ${
                          selectedId === m.user_id ? 'dashboard-student--active' : ''
                        }`}
                        onClick={() => setSelectedId(m.user_id)}
                      >
                        <div className="dashboard-student-avatar">{studentInitial(m)}</div>
                        <div className="dashboard-student-body">
                          <div className="dashboard-student-name">{studentLabel(m)}</div>
                          <div className="dashboard-student-meta">
                            {last ? relativeTime(last) : 'нет активности'}
                          </div>
                        </div>
                        <div className="dashboard-student-stats">
                          <span className="dashboard-student-score">{ruTotalScore(m.user_id)}</span>
                          <span
                            className={`dashboard-student-errors ${
                              errs === 0 ? 'dashboard-student-errors--none' : ''
                            }`}
                          >
                            {errs === 0 ? '✓ 0' : `${errs} ош.`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="dashboard-detail">
              {!selectedMember ? (
                <div className="dashboard-empty-detail">
                  <div className="dashboard-empty-detail-icon">👈</div>
                  <div>Выберите ученика слева</div>
                </div>
              ) : (
                <>
                  <div className="dashboard-detail-header">
                    <button
                      className="dashboard-back-btn"
                      onClick={() => setSelectedId(null)}
                      aria-label="Назад к списку"
                    >
                      ←
                    </button>
                    <div className="dashboard-detail-avatar">{studentInitial(selectedMember)}</div>
                    <div>
                      <div className="dashboard-detail-name">{studentLabel(selectedMember)}</div>
                      {selectedMember.email && (
                        <div className="dashboard-detail-email">{selectedMember.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-detail-stats">
                    <div className="dashboard-stat-card">
                      <div className="dashboard-stat-value">{selectedResults.length}</div>
                      <div className="dashboard-stat-label">Всего попыток</div>
                    </div>
                    <div className="dashboard-stat-card">
                      <div className="dashboard-stat-value">
                        {ruTotalScore(selectedMember.user_id)}
                      </div>
                      <div className="dashboard-stat-label">Очков (рус.)</div>
                    </div>
                    <div className="dashboard-stat-card">
                      <div className="dashboard-stat-value">
                        {ruErrorsLast7d(selectedMember.user_id)}
                      </div>
                      <div className="dashboard-stat-label">Ошибок за 7 дней</div>
                    </div>
                  </div>

                  {/* Ошибки по упражнениям — сворачиваемые */}
                  <div className="dashboard-section-title">Ошибки по упражнениям</div>
                  {aggregatedMistakes.length === 0 ? (
                    <div className="dashboard-empty-detail" style={{ padding: '30px 20px' }}>
                      🎉 Ошибок по русскому языку пока нет
                    </div>
                  ) : (
                    <div className="dashboard-mistakes">
                      {aggregatedMistakes.map(({ exercise, mistakes }) => {
                        const isAbbr = exercise === 'abbreviations';
                        const isOpen = expandedExercises.has(exercise);
                        const leftKey = `${exercise}|left`;
                        const rightKey = `${exercise}|right`;
                        return (
                          <div key={exercise} className="dashboard-mistakes-group">
                            <button
                              type="button"
                              className="dashboard-mistakes-group-title dashboard-mistakes-group-title--btn"
                              onClick={() => toggleExercise(exercise)}
                            >
                              <span>{EXERCISE_ICONS[exercise] ?? '📝'}</span>
                              <span>{EXERCISE_NAMES[exercise] ?? exercise}</span>
                              <span className="dashboard-mistakes-count">
                                {mistakes.length} уник.
                              </span>
                              <span className={`dashboard-history-chevron ${isOpen ? 'open' : ''}`} aria-hidden>
                                ▾
                              </span>
                            </button>
                            {isOpen && (
                              <>
                                {mistakes.map((m, i) => (
                                  <div key={i} className="dashboard-mistake-row">
                                    <span className="dashboard-mistake-display">{m.display}</span>
                                    <div className="dashboard-mistake-right">
                                      {!isAbbr && m.chosen && (
                                        <span className="dashboard-mistake-chosen">{m.chosen}</span>
                                      )}
                                      <span className="dashboard-mistake-correct">{m.correct}</span>
                                      {m.count > 1 && (
                                        <span className="dashboard-mistake-count">×{m.count}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div className="dashboard-mistakes-copy">
                                  <button
                                    type="button"
                                    onClick={() => copyGroup(exercise, 'left', mistakes)}
                                    title={isAbbr ? 'Копировать аббревиатуры' : 'Копировать слова'}
                                  >
                                    {copiedKey === leftKey ? '✓ Скопировано' : `📋 ${isAbbr ? 'Аббревиатуры' : 'Слова'}`}
                                  </button>
                                  <button
                                    type="button"
                                    className="dashboard-mistakes-copy--primary"
                                    onClick={() => copyGroup(exercise, 'right', mistakes)}
                                    title="Копировать правильные ответы"
                                  >
                                    {copiedKey === rightKey ? '✓ Скопировано' : '📋 Правильные ответы'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* История попыток с фильтром + пагинацией */}
                  <div className="dashboard-section-title">История попыток</div>
                  {selectedResults.length === 0 ? (
                    <div className="dashboard-empty-detail" style={{ padding: '30px 20px' }}>
                      Ученик ещё не выполнил ни одного упражнения
                    </div>
                  ) : (
                    <>
                      {/* Фильтр по упражнению */}
                      <div className="history-filter dashboard-history-filter">
                        <button
                          className={`history-filter-pill ${historyFilter === null ? 'history-filter-pill--active' : ''}`}
                          onClick={() => { setHistoryFilter(null); setHistoryLimit(HISTORY_PAGE_SIZE); }}
                        >
                          Все
                        </button>
                        {historyExercises.map((ex) => (
                          <button
                            key={ex}
                            className={`history-filter-pill ${historyFilter === ex ? 'history-filter-pill--active' : ''}`}
                            onClick={() => { setHistoryFilter(ex === historyFilter ? null : ex); setHistoryLimit(HISTORY_PAGE_SIZE); }}
                          >
                            {EXERCISE_ICONS[ex] ?? ''} {EXERCISE_NAMES[ex] ?? ex}
                          </button>
                        ))}
                      </div>

                      <div className="dashboard-history-list">
                        {visibleHistory.map((r) => {
                          const details = r.details as { correct?: number; total?: number };
                          const correct = details?.correct;
                          const total = details?.total;
                          const isRu = RU_EXERCISES.has(r.exercise_name);
                          const isOpen = expandedAttempts.has(r.id);
                          return (
                            <div key={r.id} className={`dashboard-history-item ${isOpen ? 'is-open' : ''}`}>
                              <button
                                type="button"
                                className={`dashboard-history-row ${isRu ? 'dashboard-history-row--clickable' : ''}`}
                                onClick={() => isRu && toggleAttempt(r.id)}
                                disabled={!isRu}
                              >
                                <div className="dashboard-history-left">
                                  <span>{EXERCISE_ICONS[r.exercise_name] ?? '🏋️'}</span>
                                  <span>{EXERCISE_NAMES[r.exercise_name] ?? r.exercise_name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                  {typeof correct === 'number' && typeof total === 'number' && (
                                    <span style={{ fontWeight: 600, color: '#4b5563' }}>
                                      {correct}/{total}
                                    </span>
                                  )}
                                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>{r.score}</span>
                                  <span className="dashboard-history-time">
                                    {relativeTime(r.created_at)}
                                  </span>
                                  {isRu && (
                                    <span className={`dashboard-history-chevron ${isOpen ? 'open' : ''}`} aria-hidden>
                                      ▾
                                    </span>
                                  )}
                                </div>
                              </button>
                              {isRu && isOpen && (
                                <div className="dashboard-history-details">{renderAttemptMistakes(r)}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {hasMore && (
                        <button
                          type="button"
                          className="dashboard-load-more"
                          onClick={() => setHistoryLimit((l) => l + HISTORY_PAGE_SIZE)}
                        >
                          Загрузить ещё ({filteredHistory.length - historyLimit})
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
