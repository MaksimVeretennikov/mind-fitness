import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type View = 'signin' | 'signup' | 'forgot';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showAuthModal) {
      setTimeout(() => {
        setView('signin');
        setEmail('');
        setPassword('');
        setError(null);
        setLoading(false);
        setForgotSent(false);
      }, 300);
    }
  }, [showAuthModal]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Введите email'); return; }
    if (view !== 'forgot' && password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }

    setLoading(true);

    if (view === 'forgot') {
      const err = await resetPassword(email.trim());
      setLoading(false);
      if (err) { setError(err); return; }
      setForgotSent(true);
      return;
    }

    const err = view === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);
    if (err) setError(err);
  };

  const title = view === 'signin' ? 'Войти' : view === 'signup' ? 'Создать аккаунт' : 'Восстановить пароль';

  return (
    <div
      className="auth-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
    >
      <div className="auth-card animate-auth-slide-up">
        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="auth-close"
          aria-label="Закрыть"
        >
          ×
        </button>

        {/* Logo */}
        <div className="auth-logo">
          <span>🧠</span>
        </div>

        <h2 className="auth-title">{title}</h2>

        {view === 'forgot' && forgotSent ? (
          <div className="auth-success-box">
            <div className="auth-success-icon">✉️</div>
            <p className="auth-success-text">Ссылка отправлена! Проверьте почту.</p>
            <button className="auth-link" onClick={() => { setView('signin'); setForgotSent(false); }}>
              ← Вернуться к входу
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                autoComplete="email"
                autoFocus
              />
            </div>

            {view !== 'forgot' && (
              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="auth-input"
                  autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {error && (
              <div className="auth-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                title
              )}
            </button>

            {view === 'signin' && (
              <button
                type="button"
                className="auth-link auth-link-center"
                onClick={() => { setView('forgot'); setError(null); }}
              >
                Забыли пароль?
              </button>
            )}
          </form>
        )}

        {/* Toggle sign-in / sign-up */}
        {view !== 'forgot' && (
          <div className="auth-toggle">
            {view === 'signin' ? (
              <>
                Нет аккаунта?{' '}
                <button className="auth-link" onClick={() => { setView('signup'); setError(null); }}>
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button className="auth-link" onClick={() => { setView('signin'); setError(null); }}>
                  Войти
                </button>
              </>
            )}
          </div>
        )}

        {view === 'forgot' && !forgotSent && (
          <div className="auth-toggle">
            <button className="auth-link" onClick={() => { setView('signin'); setError(null); }}>
              ← Вернуться к входу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
