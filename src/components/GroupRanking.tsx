import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroup } from '../contexts/GroupContext';
import { getGroupRanking, getGroupRankingDirect, type RankingEntry } from '../lib/groupsDB';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];

function studentName(entry: RankingEntry): string {
  return entry.display_name?.trim() || 'Участник';
}

function entryScore(entry: RankingEntry): number {
  return entry.total_score;
}

export default function GroupRanking() {
  const { showGroupRanking, setShowGroupRanking, ownedGroup, memberGroup } = useGroup();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const activeGroup = ownedGroup ?? memberGroup;

  useEffect(() => {
    if (!showGroupRanking || !activeGroup) return;
    setLoading(true);
    // Teacher (owner) uses direct DB queries via existing RLS.
    // Student (member) uses SECURITY DEFINER RPC.
    const fetch = ownedGroup ? getGroupRankingDirect : getGroupRanking;
    fetch(activeGroup.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [showGroupRanking, activeGroup, ownedGroup]);

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
                      <div className="ranking-name">{studentName(entry)}</div>
                      <div className="ranking-score">
                        {entryScore(entry)} <span className="ranking-score-label">очков</span>
                      </div>
                    </div>
                  ))}
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
