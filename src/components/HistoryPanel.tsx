import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ExerciseResult {
  id: string;
  exercise_name: string;
  score: number;
  details: Record<string, unknown>;
  created_at: string;
}

const EXERCISE_NAMES: Record<string, string> = {
  munsterberg: 'Тест Мюнстерберга',
  philwords: 'Филворды',
  schulte: 'Таблица Шульте',
  sequence: 'Последовательности',
  pairs: 'Игра на пары',
  balls: 'Шарики с номерами',
  reaction: 'Реакция на шарик',
  adverbs: 'Наречия',
  prefixes: 'Приставки',
  'spelling-nn': 'Н и НН',
  'word-forms': 'Формы слова',
  stress: 'Ударение',
};

const EXERCISE_ICONS: Record<string, string> = {
  munsterberg: '🔍',
  philwords: '📝',
  schulte: '🔢',
  sequence: '🧠',
  pairs: '🃏',
  balls: '🎯',
  reaction: '⚡',
  adverbs: '📝',
  prefixes: '✍️',
  'spelling-nn': '✏️',
  'word-forms': '📚',
  stress: '🔊',
};

function fmtTime(s: number): string {
  if (!s || s <= 0) return '0с';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}с`;
  if (sec === 0) return `${m}м`;
  return `${m}м ${sec}с`;
}

function pluralErrors(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'ошибка';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'ошибки';
  return 'ошибок';
}

type Quality = 'good' | 'ok' | 'bad';

interface ExerciseDisplay {
  primary: string;
  secondary?: string;
  quality: Quality;
}

function getDisplay(result: ExerciseResult): ExerciseDisplay {
  const d = result.details;
  const n = (k: string, def = 0) => (typeof d[k] === 'number' ? (d[k] as number) : def);
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');

  switch (result.exercise_name) {
    case 'munsterberg': {
      const found = n('found'), total = n('total', 1);
      const pct = total > 0 ? found / total : 0;
      return {
        primary: `${found} / ${total} слов`,
        quality: pct >= 0.8 ? 'good' : pct >= 0.5 ? 'ok' : 'bad',
      };
    }
    case 'philwords': {
      const elapsed = n('elapsed');
      const wordCount = n('wordCount');
      const diffStr = str('difficulty');
      const diffLabel = diffStr === 'small' ? 'маленькая' : diffStr === 'large' ? 'большая' : diffStr === 'medium' ? 'средняя' : null;
      // quality thresholds scale with word count
      const goodThresh = wordCount <= 5 ? 45 : wordCount <= 10 ? 75 : 120;
      const okThresh = wordCount <= 5 ? 90 : wordCount <= 10 ? 160 : 270;
      return {
        primary: fmtTime(elapsed),
        secondary: diffLabel ? `${wordCount} слов · ${diffLabel}` : `${wordCount} слов`,
        quality: elapsed <= goodThresh ? 'good' : elapsed <= okThresh ? 'ok' : 'bad',
      };
    }
    case 'schulte': {
      const elapsed = n('elapsed');
      const errors = n('errors');
      return {
        primary: fmtTime(elapsed),
        secondary: errors === 0 ? '✓ без ошибок' : `${errors} ${pluralErrors(errors)}`,
        quality: errors === 0 ? 'good' : errors <= 3 ? 'ok' : 'bad',
      };
    }
    case 'sequence': {
      const correct = n('correct'), total = n('total', 1);
      const pct = total > 0 ? correct / total : 0;
      const mode = str('mode');
      return {
        primary: `${correct} / ${total}`,
        secondary: mode === 'words' ? 'слов верно' : 'чисел верно',
        quality: pct >= 0.8 ? 'good' : pct >= 0.5 ? 'ok' : 'bad',
      };
    }
    case 'pairs': {
      const elapsed = n('elapsed');
      const errors = Math.max(0, n('attempts') - n('pairs', 1));
      return {
        primary: fmtTime(elapsed),
        secondary: errors === 0 ? '✓ без ошибок' : `${errors} ${pluralErrors(errors)}`,
        quality: errors === 0 ? 'good' : errors <= 3 ? 'ok' : 'bad',
      };
    }
    case 'balls': {
      const elapsed = n('elapsed');
      const errors = n('errors');
      return {
        primary: fmtTime(elapsed),
        secondary: errors === 0 ? '✓ без ошибок' : `${errors} ${pluralErrors(errors)}`,
        quality: errors === 0 ? 'good' : errors <= 2 ? 'ok' : 'bad',
      };
    }
    case 'reaction': {
      const catches = n('catches');
      const avgMs = n('avgReactionMs');
      return {
        primary: `${catches} поймал`,
        secondary: avgMs > 0 ? `реакция ${(avgMs / 1000).toFixed(2)}с` : undefined,
        quality: catches >= 15 ? 'good' : catches >= 7 ? 'ok' : 'bad',
      };
    }
    case 'adverbs': {
      const correct = n('correct'), total = n('total', 1);
      const pct = total > 0 ? correct / total : 0;
      return {
        primary: `${correct} / ${total}`,
        quality: pct >= 0.8 ? 'good' : pct >= 0.5 ? 'ok' : 'bad',
      };
    }
    default:
      return {
        primary: `${result.score}%`,
        quality: result.score >= 80 ? 'good' : result.score >= 50 ? 'ok' : 'bad',
      };
  }
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  return `${days} дн назад`;
}

function groupByDate(results: ExerciseResult[]) {
  const groups = new Map<string, ExerciseResult[]>();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  for (const r of results) {
    const d = new Date(r.created_at);
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    let label: string;
    if (dayStart.getTime() === todayStart.getTime()) label = 'Сегодня';
    else if (dayStart.getTime() === yesterdayStart.getTime()) label = 'Вчера';
    else label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(r);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

const QUALITY_CLASS: Record<Quality, string> = {
  good: 'metric-good',
  ok: 'metric-ok',
  bad: 'metric-bad',
};

export default function HistoryPanel() {
  const { user, showHistoryPanel, setShowHistoryPanel } = useAuth();
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!showHistoryPanel || !user) return;
    setLoadingData(true);
    supabase
      .from('exercise_results')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setResults((data as ExerciseResult[]) ?? []);
        setLoadingData(false);
      });
  }, [showHistoryPanel, user]);

  if (!showHistoryPanel) return null;

  const total = results.length;
  const uniqueExercises = new Set(results.map(r => r.exercise_name)).size;
  const uniqueDays = new Set(results.map(r => {
    const d = new Date(r.created_at);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })).size;

  const groups = groupByDate(results);

  return (
    <>
      <div className="history-backdrop" onClick={() => setShowHistoryPanel(false)} />

      <div className="history-panel animate-slide-in-right">
        {/* Header */}
        <div className="history-header">
          <h2 className="history-title">Моя история</h2>
          <button className="history-close" onClick={() => setShowHistoryPanel(false)} aria-label="Закрыть">×</button>
        </div>

        {loadingData ? (
          <div className="history-loading">
            <div className="history-spinner" />
            <span>Загрузка...</span>
          </div>
        ) : total === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">🧘</div>
            <p className="history-empty-text">
              Ещё нет результатов — пройди первое упражнение!
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="history-stats">
              <div className="history-stat">
                <span className="history-stat-value">{total}</span>
                <span className="history-stat-label">Всего</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{uniqueExercises}<span style={{fontSize:'0.8rem', fontWeight:500}}>/8</span></span>
                <span className="history-stat-label">Упражнений</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{uniqueDays}</span>
                <span className="history-stat-label">Дней</span>
              </div>
            </div>

            {/* Results list */}
            <div className="history-list">
              {groups.map(({ label, items }) => (
                <div key={label} className="history-group">
                  <div className="history-group-label">{label}</div>
                  {items.map(r => {
                    const display = getDisplay(r);
                    return (
                      <div key={r.id} className="history-card">
                        <span className="history-card-icon">
                          {EXERCISE_ICONS[r.exercise_name] ?? '🏋️'}
                        </span>
                        <div className="history-card-body">
                          <span className="history-card-name">
                            {EXERCISE_NAMES[r.exercise_name] ?? r.exercise_name}
                          </span>
                          <span className="history-card-time">{relativeTime(r.created_at)}</span>
                        </div>
                        <div className={`history-metric ${QUALITY_CLASS[display.quality]}`}>
                          <span className="history-metric-primary">{display.primary}</span>
                          {display.secondary && (
                            <span className="history-metric-secondary">{display.secondary}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
