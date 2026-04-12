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
};

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'badge-green';
  if (score >= 50) return 'badge-yellow';
  return 'badge-red';
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

function groupByDate(results: ExerciseResult[]): { label: string; items: ExerciseResult[] }[] {
  const groups: Map<string, ExerciseResult[]> = new Map();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  for (const r of results) {
    const d = new Date(r.created_at);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    let label: string;
    if (dayStart === today) label = 'Сегодня';
    else if (dayStart === yesterday) label = 'Вчера';
    else label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(r);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

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
  const avgScore = total > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / total)
    : 0;
  const bestScore = total > 0
    ? Math.max(...results.map(r => r.score))
    : 0;

  const groups = groupByDate(results);

  return (
    <>
      {/* Backdrop */}
      <div
        className="history-backdrop"
        onClick={() => setShowHistoryPanel(false)}
      />

      {/* Panel */}
      <div className="history-panel animate-slide-in-right">
        {/* Header */}
        <div className="history-header">
          <h2 className="history-title">Моя история</h2>
          <button
            className="history-close"
            onClick={() => setShowHistoryPanel(false)}
            aria-label="Закрыть"
          >
            ×
          </button>
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
                <span className="history-stat-label">Упражнений</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{avgScore}%</span>
                <span className="history-stat-label">Средний балл</span>
              </div>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <span className="history-stat-value">{bestScore}%</span>
                <span className="history-stat-label">Лучший</span>
              </div>
            </div>

            {/* Results list */}
            <div className="history-list">
              {groups.map(({ label, items }) => (
                <div key={label} className="history-group">
                  <div className="history-group-label">{label}</div>
                  {items.map(r => (
                    <div key={r.id} className="history-card">
                      <div className="history-card-left">
                        <span className="history-card-name">
                          {EXERCISE_NAMES[r.exercise_name] ?? r.exercise_name}
                        </span>
                        <span className="history-card-time">
                          {relativeTime(r.created_at)}
                        </span>
                      </div>
                      <span className={`history-badge ${scoreBadgeClass(r.score)}`}>
                        {r.score}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
