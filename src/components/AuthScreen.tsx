import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccess } from '../contexts/AccessContext';
import { useGroup } from '../contexts/GroupContext';
import {
  validateClassCode,
  checkTeacherCode,
  checkClassCodeExists,
  checkIndividualCode,
  consumeTeacherCode,
  consumeIndividualCode,
  joinGroupByClassCodeRpc,
  stashPendingSignup,
  clearPendingSignup,
} from '../lib/access';

type View = 'signin' | 'signup' | 'forgot';
type Role = 'student' | 'teacher' | 'individual';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { refresh: refreshAccess } = useAccess();
  const { refresh: refreshGroup } = useGroup();

  const [view, setView] = useState<View>('signin');
  const [signupRole, setSignupRole] = useState<Role | null>(null);

  // Common
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  // Role-specific
  const [classCode, setClassCode] = useState('');         // student joins here / teacher creates here
  const [teacherCode, setTeacherCode] = useState('');     // teacher only
  const [groupName, setGroupName] = useState('');         // teacher only
  const [individualCode, setIndividualCode] = useState(''); // individual only

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(null); setInfo(null); };

  const switchView = (v: View) => {
    setView(v);
    setSignupRole(null);
    reset();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim()) { setError('Введите email'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    setLoading(true);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim()) { setError('Введите email'); return; }
    setLoading(true);
    const err = await resetPassword(email.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setInfo('Ссылка для сброса пароля отправлена на почту.');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!signupRole) { setError('Выберите роль'); return; }
    if (!username.trim()) { setError('Введите имя'); return; }
    if (!email.trim()) { setError('Введите email'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (!acceptTerms) { setError('Подтвердите согласие с пользовательским соглашением'); return; }
    if (!acceptPrivacy) { setError('Подтвердите согласие на обработку персональных данных'); return; }

    if (signupRole === 'student') {
      if (!classCode.trim()) { setError('Введите код класса от учителя'); return; }
    } else if (signupRole === 'teacher') {
      if (!teacherCode.trim()) { setError('Введите код учителя'); return; }
      if (!groupName.trim()) { setError('Укажите название группы'); return; }
      const fmt = validateClassCode(classCode);
      if (fmt) { setError(fmt); return; }
    } else {
      if (!individualCode.trim()) { setError('Введите индивидуальный код'); return; }
    }

    setLoading(true);

    // 1. Pre-validate codes BEFORE creating an account.
    if (signupRole === 'student') {
      const ok = await checkClassCodeExists(classCode.trim());
      if (!ok) { setLoading(false); setError('Группа с таким кодом не найдена. Уточните у учителя.'); return; }
    } else if (signupRole === 'teacher') {
      const ok = await checkTeacherCode(teacherCode.trim());
      if (!ok) { setLoading(false); setError('Код учителя неверный или уже использован.'); return; }
      const taken = await checkClassCodeExists(classCode.trim());
      if (taken) { setLoading(false); setError('Такой код класса уже занят — выберите другой.'); return; }
    } else {
      const ok = await checkIndividualCode(individualCode.trim());
      if (!ok) { setLoading(false); setError('Индивидуальный код неверный или уже использован.'); return; }
    }

    // 2. Stash intent so JoinGroupScreen can finish if email confirmation is on.
    stashPendingSignup(
      signupRole === 'student'
        ? { role: 'student', classCode: classCode.trim(), displayName: username.trim() }
        : signupRole === 'teacher'
          ? { role: 'teacher', teacherCode: teacherCode.trim(), groupName: groupName.trim(), classCode: classCode.trim() }
          : { role: 'individual', individualCode: individualCode.trim() },
    );

    // 3. Create the account.
    const result = await signUp(email.trim(), password, username.trim(), {
      terms: acceptTerms,
      privacy: acceptPrivacy,
      marketing: acceptMarketing,
    });

    if (result.error) { setLoading(false); setError(result.error); return; }

    // 4. If we already have a session, immediately consume the code.
    if (!result.needsEmailConfirm) {
      if (signupRole === 'student') {
        const { error: rpcErr } = await joinGroupByClassCodeRpc(classCode.trim(), username.trim());
        if (rpcErr) { setLoading(false); setError(rpcErr); return; }
      } else if (signupRole === 'teacher') {
        const { error: rpcErr } = await consumeTeacherCode(
          teacherCode.trim(), groupName.trim(), classCode.trim(),
        );
        if (rpcErr) { setLoading(false); setError(rpcErr); return; }
      } else {
        const { error: rpcErr } = await consumeIndividualCode(individualCode.trim());
        if (rpcErr) { setLoading(false); setError(rpcErr); return; }
      }
      clearPendingSignup();
      // Force the Gate to re-evaluate with the freshly-promoted profile.
      // Without this the AccessContext's auto-refresh races the consume RPC,
      // sometimes seeing access_type='pending' and bouncing the user into
      // JoinGroupScreen even though they already entered the code.
      await Promise.all([refreshAccess(), refreshGroup()]);
      setLoading(false);
      return;
    }

    // 5. Email confirmation flow — code stays stashed; finish on first sign-in.
    setLoading(false);
    setInfo('Аккаунт создан. Подтвердите email — мы отправили ссылку. После входа активация группы завершится автоматически.');
    setView('signin');
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen-card">
        <div className="auth-logo"><span>🧠</span></div>
        <h1 className="auth-screen-title">Mind Fitness</h1>
        <p className="auth-screen-subtitle">
          {view === 'signin' && 'Войдите, чтобы продолжить тренировки'}
          {view === 'signup' && (signupRole === null
            ? 'Кого регистрируем?'
            : signupRole === 'student'
              ? 'Регистрация ученика — нужен код класса'
              : signupRole === 'teacher'
                ? 'Регистрация учителя — нужен код учителя'
                : 'Индивидуальный доступ — нужен индивидуальный код')}
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

        {/* ─── Sign in ─── */}
        {view === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form" noValidate>
            <Field label="Email" value={email} onChange={setEmail}
              type="email" placeholder="you@example.com" autoComplete="email" />
            <Field label="Пароль" value={password} onChange={setPassword}
              type="password" placeholder="Минимум 6 символов" autoComplete="current-password" />
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            {info && <div className="auth-info"><span>✉️</span> {info}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Войти'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => switchView('forgot')}>Забыли пароль?</button>
          </form>
        )}

        {/* ─── Forgot password ─── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form" noValidate>
            <Field label="Email" value={email} onChange={setEmail}
              type="email" placeholder="you@example.com" autoComplete="email" />
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            {info && <div className="auth-info"><span>✉️</span> {info}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Отправить ссылку'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => switchView('signin')}>← Вернуться к входу</button>
          </form>
        )}

        {/* ─── Sign up: role choice ─── */}
        {view === 'signup' && signupRole === null && (
          <>
            <div className="role-grid">
              <button type="button" className="role-card" onClick={() => { setSignupRole('student'); reset(); }}>
                <div className="role-emoji">👩‍🎓</div>
                <div className="role-name">Я ученик</div>
                <div className="role-desc">Войти в группу по коду класса от учителя</div>
              </button>
              <button type="button" className="role-card" onClick={() => { setSignupRole('teacher'); reset(); }}>
                <div className="role-emoji">👩‍🏫</div>
                <div className="role-name">Я учитель</div>
                <div className="role-desc">Создать свою группу — нужен код учителя</div>
              </button>
              <button type="button" className="role-card" onClick={() => { setSignupRole('individual'); reset(); }}>
                <div className="role-emoji">⭐</div>
                <div className="role-name">Индивидуальный доступ</div>
                <div className="role-desc">Личный доступ по индивидуальному коду — без группы</div>
              </button>
            </div>
            {info && <div className="auth-info"><span>✉️</span> {info}</div>}
          </>
        )}

        {/* ─── Sign up: student form ─── */}
        {view === 'signup' && signupRole === 'student' && (
          <form onSubmit={handleSignUp} className="auth-form" noValidate>
            <Field label="Имя" value={username} onChange={setUsername}
              placeholder="Как вас зовут?" autoComplete="name" autoFocus />
            <Field label="Email" value={email} onChange={setEmail}
              type="email" placeholder="you@example.com" autoComplete="email" />
            <Field label="Пароль" value={password} onChange={setPassword}
              type="password" placeholder="Минимум 6 символов" autoComplete="new-password" />
            <Field label="Код класса от учителя" value={classCode} onChange={setClassCode}
              placeholder="Например, 7A2026" />
            <Consents
              terms={acceptTerms} onTerms={setAcceptTerms}
              privacy={acceptPrivacy} onPrivacy={setAcceptPrivacy}
              marketing={acceptMarketing} onMarketing={setAcceptMarketing}
            />
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Создать аккаунт ученика'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => { setSignupRole(null); reset(); }}>← Сменить роль</button>
          </form>
        )}

        {/* ─── Sign up: teacher form ─── */}
        {view === 'signup' && signupRole === 'teacher' && (
          <form onSubmit={handleSignUp} className="auth-form" noValidate>
            <Field label="Имя" value={username} onChange={setUsername}
              placeholder="Как вас зовут?" autoComplete="name" autoFocus />
            <Field label="Email" value={email} onChange={setEmail}
              type="email" placeholder="you@example.com" autoComplete="email" />
            <Field label="Пароль" value={password} onChange={setPassword}
              type="password" placeholder="Минимум 6 символов" autoComplete="new-password" />
            <Field label="Код учителя" value={teacherCode} onChange={setTeacherCode}
              placeholder="Введите код, который вам выдали" />
            <Field label="Название группы" value={groupName} onChange={setGroupName}
              placeholder="Например, 7А — русский" />
            <Field label="Код класса для учеников" value={classCode} onChange={setClassCode}
              placeholder="6–20 символов, буквы и цифры"
              hint="Минимум одна буква и одна цифра. Этот код будете давать ученикам." />
            <Consents
              terms={acceptTerms} onTerms={setAcceptTerms}
              privacy={acceptPrivacy} onPrivacy={setAcceptPrivacy}
              marketing={acceptMarketing} onMarketing={setAcceptMarketing}
            />
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Создать аккаунт и группу'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => { setSignupRole(null); reset(); }}>← Сменить роль</button>
          </form>
        )}

        {/* ─── Sign up: individual form ─── */}
        {view === 'signup' && signupRole === 'individual' && (
          <form onSubmit={handleSignUp} className="auth-form" noValidate>
            <Field label="Имя" value={username} onChange={setUsername}
              placeholder="Как вас зовут?" autoComplete="name" autoFocus />
            <Field label="Email" value={email} onChange={setEmail}
              type="email" placeholder="you@example.com" autoComplete="email" />
            <Field label="Пароль" value={password} onChange={setPassword}
              type="password" placeholder="Минимум 6 символов" autoComplete="new-password" />
            <Field label="Индивидуальный код" value={individualCode} onChange={setIndividualCode}
              placeholder="Введите код, который вам выдали"
              hint="Доступ активируется на календарный месяц с момента регистрации." />
            <Consents
              terms={acceptTerms} onTerms={setAcceptTerms}
              privacy={acceptPrivacy} onPrivacy={setAcceptPrivacy}
              marketing={acceptMarketing} onMarketing={setAcceptMarketing}
            />
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? <span className="auth-spinner" /> : 'Создать индивидуальный аккаунт'}
            </button>
            <button type="button" className="auth-link auth-link-center"
              onClick={() => { setSignupRole(null); reset(); }}>← Сменить роль</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, autoComplete, autoFocus, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  hint?: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="auth-input"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
      {hint && <div className="auth-hint">{hint}</div>}
    </div>
  );
}

function Consents({
  terms, onTerms, privacy, onPrivacy, marketing, onMarketing,
}: {
  terms: boolean; onTerms: (v: boolean) => void;
  privacy: boolean; onPrivacy: (v: boolean) => void;
  marketing: boolean; onMarketing: (v: boolean) => void;
}) {
  return (
    <div className="auth-consents">
      <label className="auth-consent">
        <input type="checkbox" checked={terms} onChange={e => onTerms(e.target.checked)} />
        <span>
          Принимаю{' '}
          <a className="auth-link" href="#/terms" target="_blank" rel="noreferrer">пользовательское соглашение</a>
          <span className="auth-required">*</span>
        </span>
      </label>
      <label className="auth-consent">
        <input type="checkbox" checked={privacy} onChange={e => onPrivacy(e.target.checked)} />
        <span>
          Даю{' '}
          <a className="auth-link" href="#/privacy" target="_blank" rel="noreferrer">согласие на обработку персональных данных</a>
          <span className="auth-required">*</span>
        </span>
      </label>
      <label className="auth-consent">
        <input type="checkbox" checked={marketing} onChange={e => onMarketing(e.target.checked)} />
        <span>Получать новости и обновления сервиса</span>
      </label>
    </div>
  );
}
