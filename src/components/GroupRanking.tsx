import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroup } from '../contexts/GroupContext';
import { getGroupRanking, type RankingEntry } from '../lib/groupsDB';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];

function studentName(entry: RankingEntry): string {
  return entry.display_name?.trim() || 'Участник';
}

function AccuracyBar({ pct }: { pct: number }) {
  return (
    <div className="ranking-bar-track">
      <div
        className="ranking-bar-fill"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export default function GroupRanking() {
  const { showGroupRanking, setShowGroupRanking, ownedGroup, memberGroup } = useGroup();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const activeGroup = ownedGroup ?? memberGroup;

  useEffect(() => {
    if (!showGroupRanking || !activeGroup) return;
    setLoading(true);
    getGroupRanking(activeGroup.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [showGroupRanking, activeGroup]);

  if (!showGroupRanking || !activeGroup) return null;

  const top3 = entries.slice(0, 3);

  return createPortal(
    <>
      <div className="ranking-backdrop" onClick={() => setShowGroupRanking(false)} />
      <div className="ranking-wrap">
        <div className="ranking-modal">
          <div className="ranking-header">
            <div className="ranking-header-icon">🏆</div>
            <div>
              <div className="ranking-title">Рейтинг группы</div>
              <div className="ranking-subtitle">{activeGroup.name} · Русский язык</div>
            </div>
            <button
              className="ranking-close"
              onClick={() => setShowGroupRanking(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="ranking-body">
            {loading ? (
              <div className="ranking-empty">Загрузка…</div>
            ) : top3.length === 0 ? (
              <div className="ranking-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📚</div>
                <div>Пока никто не выполнял упражнения по русскому языку</div>
              </div>
            ) : (
              <>
                <div className="ranking-list">
                  {top3.map((entry, i) => (
                    <div key={entry.user_id} className={`ranking-row ranking-row--${i + 1}`}>
                      <div className="ranking-medal" style={{ color: MEDAL_COLORS[i] }}>
                        {MEDALS[i]}
                      </div>
                      <div className="ranking-info">
                        <div className="ranking-name">{studentName(entry)}</div>
                        <AccuracyBar pct={entry.accuracy_pct} />
                      </div>
                      <div className="ranking-stats">
                        <span className="ranking-accuracy">
                          {Math.round(entry.accuracy_pct)}%
                        </span>
                        <span className="ranking-attempts">
                          {entry.total_attempts}{' '}
                          {entry.total_attempts === 1 ? 'попытка' : entry.total_attempts < 5 ? 'попытки' : 'попыток'}
                        </span>
                        <span className="ranking-mastery">
                          {Math.round(entry.mastery_score)} м
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ranking-legend">
                  <div className="ranking-legend-row">
                    <span className="ranking-legend-dot ranking-legend-dot--accuracy" />
                    <span><strong>%</strong> — точность (правильные / всего)</span>
                  </div>
                  <div className="ranking-legend-row">
                    <span className="ranking-legend-dot ranking-legend-dot--mastery" />
                    <span><strong>м</strong> — мастерство (точность × объём)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
