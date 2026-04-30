import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPasswordModal() {
  const { resetPasswordMode, setResetPasswordMode, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!resetPasswordMode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }

    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);

    if (err) { setError(err); return; }
    setDone(true);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card animate-auth-slide-up">
        <div className="auth-logo"><span>🔑</span></div>
        <h2 className="auth-title">Новый пароль</h2>

        {done ? (
          <div className="auth-success-box">
            <div className="auth-success-icon">✅</div>
            <p className="auth-success-text">Пароль успешно обновлён!</p>
            <button
              className="auth-link"
              onClick={() => { setResetPasswordMode(false); setDone(false); setPassword(''); setConfirm(''); }}
            >
              Продолжить
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label className="auth-label">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="auth-input"
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Повторите пароль"
                className="auth-input"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="auth-error"><span>⚠️</span> {error}</div>
            )}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Сохранить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
