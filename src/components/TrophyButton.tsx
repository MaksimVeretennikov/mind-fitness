import { useGroup } from '../contexts/GroupContext';

export default function TrophyButton() {
  const { ownedGroup, memberGroup, setShowGroupRanking } = useGroup();

  if (!ownedGroup && !memberGroup) return null;

  return (
    <button
      className="trophy-btn"
      onClick={() => setShowGroupRanking(true)}
      aria-label="Рейтинг группы"
      title="Рейтинг группы"
    >
      🏆
    </button>
  );
}
