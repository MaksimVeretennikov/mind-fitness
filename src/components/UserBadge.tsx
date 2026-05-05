import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { useAccess } from '../contexts/AccessContext';
import { navigate } from '../lib/router';
import { supabase } from '../lib/supabase';

const RU_MONTHS = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];

function formatAccessDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function UserBadge() {
  const { user, loading, setShowAuthModal, setShowHistoryPanel, signOut } = useAuth();
  const { isAdmin, profile } = useAccess();
  const { ownedGroup, memberGroup, memberNickname, setShowGroupModal, setShowTeacherDashboard, updateNickname } = useGroup();
  const [open, setOpen] = useState(false);
  const [nickOpen, setNickOpen] = useState(false);
  const [nickValue, setNickValue] = useState('');
  const [nickSaving, setNickSaving] = useState(false);
  const [nickError, setNickError] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setTotalScore(null); return; }
    supabase
      .from('streaks')
      .select('total_score')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setTotalScore((data as { total_score?: number } | null)?.total_score ?? 0);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <div className="user-badge-root">
        <button
          onClick={() => setShowAuthModal(true)}
          className="user-badge-login"
        >
          Войти
        </button>
      </div>
    );
  }

  const displayName = (user.user_metadata?.full_name as string | undefined)
    || (user.user_metadata?.name as string | undefined)
    || '';
  const initial = displayName ? displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?');
  const activeGroup = ownedGroup ?? memberGroup;
  const isOwner = !!ownedGroup;

  function openNickEditor() {
    setNickValue(memberNickname ?? '');
    setNickError(null);
    setNickOpen(true);
  }

  async function saveNick() {
    setNickSaving(true);
    setNickError(null);
    const err = await updateNickname(nickValue);
    setNickSaving(false);
    if (err) { setNickError(err); return; }
    setNickOpen(false);
  }

  return (
    <div className="user-badge-root" ref={dropdownRef}>
      <button
        className="user-badge-avatar"
        onClick={() => setOpen(o => !o)}
        aria-label="Меню пользователя"
      >
        {initial}
      </button>

      {open && (
        <div className="user-badge-dropdown animate-fade-drop">
          {displayName && <div className="user-badge-name">{displayName}</div>}
          <div className="user-badge-email">{user.email}</div>
          {activeGroup && (
            <div className="user-badge-group">
              <span className="user-badge-group-icon">{isOwner ? '👩‍🏫' : '🎓'}</span>
              <span className="user-badge-group-name">{activeGroup.name}</span>
            </div>
          )}
          {isOwner && ownedGroup && (
            <div className="user-badge-access">
              <span className="user-badge-access-icon">🗓️</span>
              <span className="user-badge-access-text">
                {ownedGroup.access_until == null ? (
                  <>Доступ: <strong>бессрочный</strong></>
                ) : (
                  <>Доступ до <strong>{formatAccessDate(ownedGroup.access_until)}</strong></>
                )}
              </span>
            </div>
          )}
          {profile?.access_type === 'individual' && profile.access_until && (
            <div className="user-badge-access">
              <span className="user-badge-access-icon">🗓️</span>
              <span className="user-badge-access-text">
                Доступ до <strong>{formatAccessDate(profile.access_until)}</strong>
              </span>
            </div>
          )}
          {totalScore !== null && totalScore > 0 && (
            <div className="user-badge-score">
              <span className="user-badge-score-icon">⭐</span>
              <span className="user-badge-score-value">{totalScore}</span>
              <span className="user-badge-score-label">очков (рус.)</span>
            </div>
          )}
          <div className="user-badge-divider" />
          <button
            className="user-badge-item"
            onClick={() => { setOpen(false); setShowHistoryPanel(true); }}
          >
            <span className="user-badge-item-icon">📊</span>
            История
          </button>
          {isOwner ? (
            <button
              className="user-badge-item"
              onClick={() => { setOpen(false); setShowTeacherDashboard(true); }}
            >
              <span className="user-badge-item-icon">👩‍🏫</span>
              Моя группа
            </button>
          ) : profile?.access_type === 'individual' ? null : (
            <button
              className="user-badge-item"
              onClick={() => { setOpen(false); setShowGroupModal(true); }}
            >
              <span className="user-badge-item-icon">{memberGroup ? '🎓' : '👥'}</span>
              {memberGroup ? 'Моя группа' : 'Группа'}
            </button>
          )}
          {memberGroup && (
            <div className="user-badge-nick-section">
              <button
                className="user-badge-item"
                onClick={() => nickOpen ? setNickOpen(false) : openNickEditor()}
              >
                <span className="user-badge-item-icon">🏷️</span>
                <span className="user-badge-nick-label">
                  Ник в рейтинге
                  {memberNickname && (
                    <span className="user-badge-nick-current">{memberNickname}</span>
                  )}
                </span>
                <span className="user-badge-nick-chevron">{nickOpen ? '▴' : '▾'}</span>
              </button>
              {nickOpen && (
                <div className="user-badge-nick-editor">
                  <input
                    className="user-badge-nick-input"
                    value={nickValue}
                    onChange={(e) => setNickValue(e.target.value)}
                    placeholder={displayName || 'Ваш ник'}
                    maxLength={40}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveNick(); if (e.key === 'Escape') setNickOpen(false); }}
                  />
                  {nickError && <div className="user-badge-nick-error">{nickError}</div>}
                  <button
                    className="user-badge-nick-save"
                    onClick={saveNick}
                    disabled={nickSaving}
                  >
                    {nickSaving ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>
          )}
          {isAdmin && (
            <button
              className="user-badge-item"
              onClick={() => { setOpen(false); navigate('/admin'); }}
            >
              <span className="user-badge-item-icon">🛠️</span>
              Админка
            </button>
          )}
          <button
            className="user-badge-item user-badge-item-signout"
            onClick={() => { setOpen(false); signOut(); }}
          >
            <span className="user-badge-item-icon">🚪</span>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
