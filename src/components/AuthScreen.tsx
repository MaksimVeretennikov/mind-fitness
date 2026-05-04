import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../lib/router';

type View = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError(null);
    setInfo(null);
  };

  const switchView = (v: View) => {
    setView(v);
    resetState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email.trim()) { setError('Введите email'); return; }
    if (view !== 'forgot' && password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (view === 'signup' && !username.trim()) { setError('Введите имя'); return; }
    if (view === 'signup' && !acceptTerms) { setError('Подтвердите согласие с пользовательским соглашением'); return; }
    if (view === 'signup' && !acceptPrivacy) { setError('Подтвердите согласие на обработку персональных данных'); return; }

    setLoading(true);

    if (view === 'forgot') {
      const err = await resetPassword(email.trim());
      setLoading(false);
      if (err) { setError(err); return; }
      setInfo('Ссылка для сброса пароля отправлена на почту.');
      return;
    }

    if (view === 'signin') {
      const err = await signIn(email.trim(), password);
      setLoading(false);
      if (err) setError(err);
      return;
    }

    // signup
    const result = await signUp(email.trim(), password, username.trim(), {
      terms: acceptTerms,
      privacy: acceptPrivacy,
      marketing: acceptMarketing,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (result.needsEmailConfirm) {
      setInfo('Аккаунт создан. Подтвердите email — мы отправили ссылку.');
      setView('signin');
    }
    // Otherwise the AuthContext will pick up the new session and the gate
    // (App.tsx) will route the user to the JoinGroupScreen.
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen-card">
        <div className="auth-logo"><span>🧠</span></div>
        <h1 className="auth-screen-title">Mind Fitness</h1>
        <p className="auth-screen-subtitle">
          {view === 'signin' && 'Войдите, чтобы продолжить тренировки'}
          {view === 'signup' && 'Создайте аккаунт ученика или учителя'}
          {view === 'forgot' && 'Восстановление доступа к аккаунту'}
        </p>

        {view !== 'forgot' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${view === 'signin' ? 'auth-tab-active' : ''}`}
              onClick={() => switchView('signin')}
            >Войти</button>
            <button
              type="button"
              className={`auth-tab ${view === 'signup' ? 'auth-tab-active' : ''}`}
              onClick={() => switchView('signup')}
            >Регистрация</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {view === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Имя</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Как вас зовут?"
                className="auth-input"
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              autoComplete="email"
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

          {view === 'signup' && (
            <div className="auth-consents">
              <label className="auth-consent">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                />
                <span>
                  Я принимаю{' '}
                  <button type="button" className="auth-link" onClick={() => navigate('/terms')}>
                    пользовательское соглашение
                  </button>
                  *
                </span>
              </label>
              <label className="auth-consent">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={e => setAcceptPrivacy(e.target.checked)}
                />
                <span>
                  Даю{' '}
                  <button type="button" className="auth-link" onClick={() => navigate('/privacy')}>
                    согласие на обработку персональных данных
                  </button>
                  *
                </span>
              </label>
              <label className="auth-consent">
                <input
                  type="checkbox"
                  checked={acceptMarketing}
                  onChange={e => setAcceptMarketing(e.target.checked)}
                />
                <span>Хочу получать новости и обновления сервиса (необязательно)</span>
              </label>
            </div>
          )}

          {error && (
            <div className="auth-error"><span>⚠️</span> {error}</div>
          )}
          {info && (
            <div className="auth-info"><span>✉️</span> {info}</div>
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? <span className="auth-spinner" /> :
              view === 'signin' ? 'Войти' :
              view === 'signup' ? 'Создать аккаунт' :
              'Отправить ссылку'}
          </button>

          {view === 'signin' && (
            <button type="button" className="auth-link auth-link-center"
              onClick={() => switchView('forgot')}>
              Забыли пароль?
            </button>
          )}

          {view === 'forgot' && (
            <button type="button" className="auth-link auth-link-center"
              onClick={() => switchView('signin')}>
              ← Вернуться к входу
            </button>
          )}
        </form>

        <div className="auth-screen-foot">
          <button type="button" className="auth-link" onClick={() => navigate('/terms')}>
            Пользовательское соглашение
          </button>
          {' • '}
          <button type="button" className="auth-link" onClick={() => navigate('/privacy')}>
            Согласие на обработку ПДн
          </button>
        </div>
      </div>
    </div>
  );
}
