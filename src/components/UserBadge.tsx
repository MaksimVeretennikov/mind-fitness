import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';

export default function UserBadge() {
  const { user, loading, setShowAuthModal, setShowHistoryPanel, signOut } = useAuth();
  const { ownedGroup, memberGroup, setShowGroupModal, setShowTeacherDashboard } = useGroup();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          ) : (
            <button
              className="user-badge-item"
              onClick={() => { setOpen(false); setShowGroupModal(true); }}
            >
              <span className="user-badge-item-icon">{memberGroup ? '🎓' : '👥'}</span>
              {memberGroup ? 'Моя группа' : 'Группа'}
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
