import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccess } from '../contexts/AccessContext';
import { useGroup } from '../contexts/GroupContext';
import {
  consumeTeacherCode,
  joinGroupByClassCodeRpc,
  validateClassCode,
  readPendingSignup,
  clearPendingSignup,
} from '../lib/access';

type Role = null | 'student' | 'teacher';

export default function JoinGroupScreen() {
  const { user, signOut } = useAuth();
  const { refresh: refreshAccess } = useAccess();
  const { refresh: refreshGroup } = useGroup();

  const [role, setRole] = useState<Role>(null);

  // Student fields
  const [classCode, setClassCode] = useState('');
  const [displayName, setDisplayName] = useState(
    () => (user?.user_metadata?.full_name as string | undefined) ||
          (user?.user_metadata?.name as string | undefined) ||
          (user?.email?.split('@')[0]) || '',
  );

  // Teacher fields
  const [teacherCode, setTeacherCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumed, setResumed] = useState(false);

  // Resume after email confirmation: pre-fill role + codes from the stash.
  // Resume after email confirmation: pre-fill role + codes from the stash and
  // immediately try to consume them. The user already entered everything at
  // signup, so we don't make them re-confirm.
  useEffect(() => {
    const pending = readPendingSignup();
    if (!pending) return;
    if (pending.role === 'student') {
      setRole('student');
      setClassCode(pending.classCode);
      if (pending.displayName) setDisplayName(pending.displayName);
    } else {
      setRole('teacher');
      setTeacherCode(pending.teacherCode);
      setGroupName(pending.groupName);
      setNewClassCode(pending.classCode);
    }
    setResumed(true);

    (async () => {
      setLoading(true);
      setError(null);
      const result = pending.role === 'student'
        ? await joinGroupByClassCodeRpc(pending.classCode, pending.displayName)
        : await consumeTeacherCode(pending.teacherCode, pending.groupName, pending.classCode);
      if (result.error) {
        // Code became invalid / taken / full between signup and confirm —
        // surface the error and let the user fix it manually.
        setError(result.error);
        setLoading(false);
        return;
      }
      clearPendingSignup();
      await Promise.all([refreshAccess(), refreshGroup()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!classCode.trim()) { setError('Введите код класса'); return; }
    if (!displayName.trim()) { setError('Укажите ваше имя'); return; }
    setLoading(true);
    const { error: err } = await joinGroupByClassCodeRpc(classCode.trim(), displayName.trim());
    if (err) { setLoading(false); setError(err); return; }
    clearPendingSignup();
    await Promise.all([refreshAccess(), refreshGroup()]);
    setLoading(false);
  };

  const submitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teacherCode.trim()) { setError('Введите код учителя'); return; }
    if (!groupName.trim()) { setError('Укажите название группы'); return; }
    const fmt = validateClassCode(newClassCode);
    if (fmt) { setError(fmt); return; }
    setLoading(true);
    const { error: err } = await consumeTeacherCode(
      teacherCode.trim(),
      groupName.trim(),
      newClassCode.trim(),
    );
    if (err) { setLoading(false); setError(err); return; }
    clearPendingSignup();
    await Promise.all([refreshAccess(), refreshGroup()]);
    setLoading(false);
  };

  // While auto-completing a stashed signup, show a tidy progress card
  // instead of the role-choice / form. Errors fall through to the form
  // so the user can edit and retry.
  if (resumed && loading && !error) {
    return (
      <div className="auth-screen">
        <div className="auth-screen-card auth-screen-card--narrow">
          <div className="auth-logo"><span>🎓</span></div>
          <h1 className="auth-screen-title">Завершаем регистрацию…</h1>
          <p className="auth-screen-subtitle">
            Активируем ваш аккаунт по введённому коду.
          </p>
          <div className="auth-loading-row"><span className="auth-spinner-dark" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen-card">
        <div className="auth-logo"><span>🎓</span></div>
        <h1 className="auth-screen-title">Подключите аккаунт</h1>
        <p className="auth-screen-subtitle">
          {resumed
            ? 'Не получилось завершить автоматически — проверьте код и попробуйте ещё раз.'
            : 'Чтобы начать заниматься, выберите свою роль и введите код.'}
        </p>

        {role === null && (
          <div className="role-grid">
            <button className="role-card" onClick={() => { setRole('student'); setError(null); }}>
              <div className="role-emoji">👩‍🎓</div>
              <div className="role-name">Я ученик</div>
              <div className="role-desc">Войти в группу по коду класса от учителя</div>
            </button>
            <button className="role-card" onClick={() => { setRole('teacher'); setError(null); }}>
              <div className="role-emoji">👩‍🏫</div>
              <div className="role-name">Я учитель</div>
              <div className="role-desc">Создать свою группу — нужен код учителя</div>
            </button>
          </div>
        )}

        {role === 'student' && (
          <form className="auth-form" onSubmit={submitStudent} noValidate>
            <div className="auth-field">
              <label className="auth-label">Код класса</label>
              <input
                type="text"
                value={classCode}
                onChange={e => setClassCode(e.target.value)}
                placeholder="Например, 7A2025"
                className="auth-input"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Как вас будет видеть учитель</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Имя и фамилия"
                className="auth-input"
              />
            </div>
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Войти в группу'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => { setRole(null); setError(null); }}>
              ← Назад
            </button>
          </form>
        )}

        {role === 'teacher' && (
          <form className="auth-form" onSubmit={submitTeacher} noValidate>
            <div className="auth-field">
              <label className="auth-label">Код учителя</label>
              <input
                type="text"
                value={teacherCode}
                onChange={e => setTeacherCode(e.target.value)}
                placeholder="Введите код, который вам выдали"
                className="auth-input"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Название группы</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Например, 7А — русский"
                className="auth-input"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Код класса для учеников</label>
              <input
                type="text"
                value={newClassCode}
                onChange={e => setNewClassCode(e.target.value)}
                placeholder="6–20 символов, буквы и цифры"
                className="auth-input"
              />
              <div className="auth-hint">
                Минимум одна буква и одна цифра. Этот код будете давать ученикам — учитывайте, чтобы он не был слишком простым.
              </div>
            </div>
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Создать группу'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => { setRole(null); setError(null); }}>
              ← Назад
            </button>
          </form>
        )}

        <div className="auth-screen-foot">
          Вошли как {user?.email}.{' '}
          <button type="button" className="auth-link" onClick={signOut}>Выйти</button>
        </div>
      </div>
    </div>
  );
}
