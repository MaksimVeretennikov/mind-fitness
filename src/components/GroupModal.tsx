import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroup } from '../contexts/GroupContext';

export default function GroupModal() {
  const {
    showGroupModal,
    setShowGroupModal,
    ownedGroup,
    memberGroup,
    joinByCode,
    leave,
    setShowTeacherDashboard,
  } = useGroup();

  const [view, setView] = useState<'status' | 'join'>('status');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!showGroupModal) return null;

  function close() {
    setShowGroupModal(false);
    setTimeout(() => {
      setView('status');
      setJoinCode('');
      setError(null);
    }, 200);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await joinByCode(joinCode);
    setBusy(false);
    if (err) setError(err);
    else close();
  }

  async function handleLeave() {
    if (!confirm('Выйти из группы?')) return;
    setBusy(true);
    await leave();
    setBusy(false);
    close();
  }

  const inGroup = !!ownedGroup || !!memberGroup;

  const body = (() => {
    if (view === 'join') {
      return (
        <form className="group-modal-body" onSubmit={handleJoin}>
          <p className="group-modal-subtitle">Введите код класса от учителя.</p>
          <label className="group-modal-label">
            Код класса
            <input
              className="group-modal-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Например, 7A2026"
              autoFocus
            />
          </label>
          {error && <div className="group-modal-error">{error}</div>}
          <div className="group-modal-actions">
            <button
              type="button"
              className="group-modal-btn group-modal-btn--ghost"
              onClick={() => { setError(null); setView('status'); }}
            >← Назад</button>
            <button
              type="submit"
              className="group-modal-btn group-modal-btn--primary"
              disabled={busy || !joinCode.trim()}
            >
              {busy ? 'Проверяем…' : 'Присоединиться'}
            </button>
          </div>
        </form>
      );
    }

    if (inGroup) {
      return (
        <div className="group-modal-body">
          {ownedGroup && (
            <div className="group-status-card group-status-card--owner">
              <div className="group-status-label">Ваша группа</div>
              <div className="group-status-name">{ownedGroup.name}</div>
              <div className="group-status-code">
                Код: <span>{ownedGroup.code}</span>
              </div>
              <button
                className="group-modal-btn group-modal-btn--primary"
                onClick={() => { setShowTeacherDashboard(true); close(); }}
              >📊 Открыть дашборд</button>
            </div>
          )}
          {memberGroup && (
            <div className="group-status-card">
              <div className="group-status-label">Вы в группе</div>
              <div className="group-status-name">{memberGroup.name}</div>
              <button
                className="group-modal-btn group-modal-btn--danger"
                onClick={handleLeave}
                disabled={busy}
              >Выйти из группы</button>
            </div>
          )}
        </div>
      );
    }

    // No group at all (legacy individual user) — only join is offered.
    return (
      <div className="group-modal-body">
        <p className="group-modal-subtitle">
          Вы пока не состоите в группе. Чтобы присоединиться, попросите у учителя код класса.
        </p>
        <button
          className="group-option-card"
          onClick={() => { setError(null); setView('join'); }}
        >
          <div className="group-option-icon">🎓</div>
          <div>
            <div className="group-option-title">Присоединиться к группе</div>
            <div className="group-option-desc">По коду класса от учителя</div>
          </div>
        </button>
      </div>
    );
  })();

  return createPortal(
    <>
      <div className="group-modal-backdrop" onClick={close} />
      <div className="group-modal-wrap">
        <div className="group-modal" onClick={(e) => e.stopPropagation()}>
          <div className="group-modal-header">
            <h2 className="group-modal-title">
              {inGroup ? 'Группа' : 'Группа учеников'}
            </h2>
            <button
              className="group-modal-close"
              onClick={close}
              aria-label="Закрыть"
            >×</button>
          </div>
          {body}
        </div>
      </div>
    </>,
    document.body,
  );
}
