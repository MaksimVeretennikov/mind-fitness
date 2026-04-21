import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroup } from '../contexts/GroupContext';

type View = 'choose' | 'join' | 'create-code' | 'create-form';

const TEACHER_CODE = (import.meta.env.VITE_TEACHER_CODE as string | undefined) ?? 'im2012';

export default function GroupModal() {
  const {
    showGroupModal,
    setShowGroupModal,
    ownedGroup,
    memberGroup,
    createGroup,
    joinByCode,
    leave,
    setShowTeacherDashboard,
  } = useGroup();

  const [view, setView] = useState<View>('choose');
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!showGroupModal) return null;

  function close() {
    setShowGroupModal(false);
    // reset after close animation
    setTimeout(() => {
      setView('choose');
      setTeacherCodeInput('');
      setGroupName('');
      setClassCode('');
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

  function handleTeacherCode(e: React.FormEvent) {
    e.preventDefault();
    if (teacherCodeInput.trim() === TEACHER_CODE) {
      setError(null);
      setView('create-form');
    } else {
      setError('Неверный код учителя');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await createGroup(groupName, classCode);
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

  // If user already in a group / owns a group — show status screen
  const inGroup = !!ownedGroup || !!memberGroup;

  const body = (() => {
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
                onClick={() => {
                  setShowTeacherDashboard(true);
                  close();
                }}
              >
                📊 Открыть дашборд
              </button>
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
              >
                Выйти из группы
              </button>
            </div>
          )}
        </div>
      );
    }

    if (view === 'choose') {
      return (
        <div className="group-modal-body">
          <p className="group-modal-subtitle">
            Присоединитесь к группе своего учителя или создайте новую
          </p>
          <button
            className="group-option-card"
            onClick={() => {
              setError(null);
              setView('join');
            }}
          >
            <div className="group-option-icon">🎓</div>
            <div>
              <div className="group-option-title">Присоединиться</div>
              <div className="group-option-desc">По коду от учителя</div>
            </div>
          </button>
          <button
            className="group-option-card"
            onClick={() => {
              setError(null);
              setView('create-code');
            }}
          >
            <div className="group-option-icon">✨</div>
            <div>
              <div className="group-option-title">Создать группу</div>
              <div className="group-option-desc">Нужен код учителя</div>
            </div>
          </button>
        </div>
      );
    }

    if (view === 'join') {
      return (
        <form className="group-modal-body" onSubmit={handleJoin}>
          <label className="group-modal-label">
            Код группы
            <input
              className="group-modal-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Например, ru2026"
              autoFocus
            />
          </label>
          {error && <div className="group-modal-error">{error}</div>}
          <div className="group-modal-actions">
            <button
              type="button"
              className="group-modal-btn group-modal-btn--ghost"
              onClick={() => {
                setError(null);
                setView('choose');
              }}
            >
              ← Назад
            </button>
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

    if (view === 'create-code') {
      return (
        <form className="group-modal-body" onSubmit={handleTeacherCode}>
          <p className="group-modal-subtitle">
            Создание группы доступно только учителям. Введите код доступа.
          </p>
          <label className="group-modal-label">
            Код учителя
            <input
              type="password"
              className="group-modal-input"
              value={teacherCodeInput}
              onChange={(e) => setTeacherCodeInput(e.target.value)}
              autoFocus
            />
          </label>
          {error && <div className="group-modal-error">{error}</div>}
          <div className="group-modal-actions">
            <button
              type="button"
              className="group-modal-btn group-modal-btn--ghost"
              onClick={() => {
                setError(null);
                setView('choose');
              }}
            >
              ← Назад
            </button>
            <button
              type="submit"
              className="group-modal-btn group-modal-btn--primary"
              disabled={!teacherCodeInput.trim()}
            >
              Продолжить
            </button>
          </div>
        </form>
      );
    }

    // create-form
    return (
      <form className="group-modal-body" onSubmit={handleCreate}>
        <label className="group-modal-label">
          Название группы
          <input
            className="group-modal-input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Например, 8 класс, вторник"
            autoFocus
          />
        </label>
        <label className="group-modal-label">
          Код для учеников
          <input
            className="group-modal-input"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="Придумайте код, например ru2026"
          />
          <span className="group-modal-hint">
            Ученики будут вводить его, чтобы присоединиться
          </span>
        </label>
        {error && <div className="group-modal-error">{error}</div>}
        <div className="group-modal-actions">
          <button
            type="button"
            className="group-modal-btn group-modal-btn--ghost"
            onClick={() => {
              setError(null);
              setView('create-code');
            }}
          >
            ← Назад
          </button>
          <button
            type="submit"
            className="group-modal-btn group-modal-btn--primary"
            disabled={busy || !groupName.trim() || !classCode.trim()}
          >
            {busy ? 'Создаём…' : 'Создать'}
          </button>
        </div>
      </form>
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
            >
              ×
            </button>
          </div>
          {body}
        </div>
      </div>
    </>,
    document.body,
  );
}
