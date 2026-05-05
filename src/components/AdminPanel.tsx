import { useEffect, useState, useCallback } from 'react';
import {
  adminCreateTeacherCode,
  adminListTeacherCodes,
  adminDeleteTeacherCode,
  adminListGroups,
  adminUpdateGroupLimit,
  adminCreateIndividualCode,
  adminListIndividualCodes,
  adminDeleteIndividualCode,
  adminSetIndividualAccessMinutes,
  type TeacherCodeRow,
  type AdminGroupRow,
  type IndividualCodeRow,
} from '../lib/admin';
import { navigate } from '../lib/router';

type Tab = 'codes' | 'individual' | 'groups';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('codes');
  const [codes, setCodes] = useState<TeacherCodeRow[]>([]);
  const [individual, setIndividual] = useState<IndividualCodeRow[]>([]);
  const [groups, setGroups] = useState<AdminGroupRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (tab === 'codes') setCodes(await adminListTeacherCodes());
    else if (tab === 'individual') setIndividual(await adminListIndividualCodes());
    else setGroups(await adminListGroups());
    setLoading(false);
  }, [tab]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="admin-page">
      <div className="admin-bar">
        <button className="auth-link" onClick={() => navigate('/')}>← В приложение</button>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'codes' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('codes')}
          >Коды учителей</button>
          <button
            className={`admin-tab ${tab === 'individual' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('individual')}
          >Индивидуальные коды</button>
          <button
            className={`admin-tab ${tab === 'groups' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('groups')}
          >Группы</button>
        </div>
      </div>

      {tab === 'codes' && (
        <CodesTab codes={codes} loading={loading} onChanged={refresh} />
      )}
      {tab === 'individual' && (
        <IndividualTab codes={individual} loading={loading} onChanged={refresh} />
      )}
      {tab === 'groups' && (
        <GroupsTab groups={groups} loading={loading} onChanged={refresh} />
      )}
    </div>
  );
}

function IndividualTab({
  codes, loading, onChanged,
}: { codes: IndividualCodeRow[]; loading: boolean; onChanged: () => void }) {
  const [note, setNote] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null); setCreated(null);
    setCreating(true);
    const { code, error: err } = await adminCreateIndividualCode(
      note.trim() || null,
      customCode.trim() || null,
    );
    setCreating(false);
    if (err) { setError(err); return; }
    setCreated(code ?? null);
    setNote(''); setCustomCode('');
    onChanged();
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Удалить неиспользованный код ${code}?`)) return;
    const err = await adminDeleteIndividualCode(code);
    if (err) alert(err);
    else onChanged();
  };

  const handleSetExpiry = async (code: string) => {
    const raw = prompt(`Через сколько минут истекает доступ для кода ${code}?\n(1 = через минуту, 60 = через час; отрицательное число — уже истёк)`, '1');
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) { alert('Введите целое число'); return; }
    const { error: err } = await adminSetIndividualAccessMinutes(code, n);
    if (err) alert(err);
    else onChanged();
  };

  return (
    <div className="admin-card">
      <h2 className="admin-h2">Создать индивидуальный код</h2>
      <div className="admin-form">
        <div className="auth-hint">
          Одноразовый код для одного человека без группы. Доступ — на календарный месяц с момента активации.
        </div>
        <label className="admin-field">
          <span>Заметка (для себя)</span>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Например, Иванов Пётр — оплата 2026-05-05"
            className="auth-input"
          />
        </label>
        <label className="admin-field">
          <span>Код вручную (необязательно)</span>
          <input
            type="text"
            value={customCode}
            onChange={e => setCustomCode(e.target.value)}
            placeholder="Если пусто — будет сгенерирован"
            className="auth-input"
          />
        </label>
        <button className="auth-submit" onClick={handleCreate} disabled={creating}>
          {creating ? <span className="auth-spinner" /> : 'Сгенерировать код'}
        </button>
        {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
        {created && (
          <div className="auth-info">
            <span>✅</span> Код создан: <code>{created}</code> — отправьте человеку.
          </div>
        )}
      </div>

      <h2 className="admin-h2">Все индивидуальные коды</h2>
      {loading && <div className="admin-empty">Загрузка…</div>}
      {!loading && codes.length === 0 && <div className="admin-empty">Кодов пока нет.</div>}
      {!loading && codes.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Заметка</th>
                <th>Использован</th>
                <th>Доступ до</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.code}>
                  <td data-label="Код"><code>{c.code}</code></td>
                  <td data-label="Заметка">{c.note ?? <span className="muted">—</span>}</td>
                  <td data-label="Использован">
                    {c.used_at ? (
                      <span title={c.used_by ?? ''}>
                        {c.used_by_email ?? c.used_by}{' '}
                        <span className="muted">({fmtDate(c.used_at)})</span>
                      </span>
                    ) : (
                      <span className="badge badge-fresh">не использован</span>
                    )}
                  </td>
                  <td data-label="Доступ до" className="muted">{c.access_until ? fmtDate(c.access_until) : '—'}</td>
                  <td data-label="Создан" className="muted">{fmtDate(c.created_at)}</td>
                  <td>
                    {c.used_by ? (
                      <button className="btn-mini" onClick={() => handleSetExpiry(c.code)}>
                        Срок…
                      </button>
                    ) : (
                      <button className="btn-mini-danger" onClick={() => handleDelete(c.code)}>
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CodesTab({
  codes, loading, onChanged,
}: { codes: TeacherCodeRow[]; loading: boolean; onChanged: () => void }) {
  const [limit, setLimit] = useState(10);
  const [note, setNote] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null); setCreated(null);
    if (!Number.isFinite(limit) || limit < 1) { setError('Лимит должен быть числом ≥ 1'); return; }
    setCreating(true);
    const { code, error: err } = await adminCreateTeacherCode(
      limit,
      note.trim() || null,
      customCode.trim() || null,
    );
    setCreating(false);
    if (err) { setError(err); return; }
    setCreated(code ?? null);
    setNote(''); setCustomCode('');
    onChanged();
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Удалить неиспользованный код ${code}?`)) return;
    const err = await adminDeleteTeacherCode(code);
    if (err) alert(err);
    else onChanged();
  };

  return (
    <div className="admin-card">
      <h2 className="admin-h2">Создать новый код</h2>
      <div className="admin-form">
        <label className="admin-field">
          <span>Лимит учеников</span>
          <input
            type="number"
            value={limit}
            min={1}
            max={500}
            onChange={e => setLimit(parseInt(e.target.value, 10) || 0)}
            className="auth-input"
          />
        </label>
        <label className="admin-field">
          <span>Заметка (для себя)</span>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Например, Иванова Анна — оплата 2026-05-01"
            className="auth-input"
          />
        </label>
        <label className="admin-field">
          <span>Код вручную (необязательно)</span>
          <input
            type="text"
            value={customCode}
            onChange={e => setCustomCode(e.target.value)}
            placeholder="Если пусто — будет сгенерирован"
            className="auth-input"
          />
        </label>
        <button className="auth-submit" onClick={handleCreate} disabled={creating}>
          {creating ? <span className="auth-spinner" /> : 'Сгенерировать код'}
        </button>
        {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
        {created && (
          <div className="auth-info">
            <span>✅</span> Код создан: <code>{created}</code> — отправьте его учителю.
          </div>
        )}
      </div>

      <h2 className="admin-h2">Все коды</h2>
      {loading && <div className="admin-empty">Загрузка…</div>}
      {!loading && codes.length === 0 && <div className="admin-empty">Кодов пока нет.</div>}
      {!loading && codes.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Лимит</th>
                <th>Заметка</th>
                <th>Использован</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.code}>
                  <td data-label="Код"><code>{c.code}</code></td>
                  <td data-label="Лимит">{c.student_limit}</td>
                  <td data-label="Заметка">{c.note ?? <span className="muted">—</span>}</td>
                  <td data-label="Использован">
                    {c.used_at ? (
                      <span title={c.used_by ?? ''}>
                        {c.used_by_email ?? c.used_by}{' '}
                        <span className="muted">({fmtDate(c.used_at)})</span>
                      </span>
                    ) : (
                      <span className="badge badge-fresh">не использован</span>
                    )}
                  </td>
                  <td data-label="Создан" className="muted">{fmtDate(c.created_at)}</td>
                  <td>
                    {!c.used_at && (
                      <button className="btn-mini-danger" onClick={() => handleDelete(c.code)}>
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupsTab({
  groups, loading, onChanged,
}: { groups: AdminGroupRow[]; loading: boolean; onChanged: () => void }) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateLimit = async (g: AdminGroupRow) => {
    const raw = prompt(`Новый лимит для «${g.name}» (сейчас ${g.student_limit}):`, String(g.student_limit));
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) { alert('Введите число ≥ 1'); return; }
    setSavingId(g.id);
    const err = await adminUpdateGroupLimit(g.id, n);
    setSavingId(null);
    if (err) alert(err);
    else onChanged();
  };

  return (
    <div className="admin-card">
      <h2 className="admin-h2">Все группы</h2>
      {loading && <div className="admin-empty">Загрузка…</div>}
      {!loading && groups.length === 0 && <div className="admin-empty">Групп пока нет.</div>}
      {!loading && groups.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Код класса</th>
                <th>Учитель</th>
                <th>Учеников</th>
                <th>Лимит</th>
                <th>Создана</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const ratio = g.member_count / g.student_limit;
                return (
                  <tr key={g.id}>
                    <td data-label="Название">{g.name}</td>
                    <td data-label="Код класса"><code>{g.code}</code></td>
                    <td data-label="Учитель">{g.owner_email ?? <span className="muted">{g.owner_id}</span>}</td>
                    <td data-label="Учеников">{g.member_count}</td>
                    <td data-label="Лимит" className={ratio >= 1 ? 'limit-full' : ratio > 0.8 ? 'limit-near' : ''}>
                      {g.student_limit}
                    </td>
                    <td data-label="Создана" className="muted">{fmtDate(g.created_at)}</td>
                    <td>
                      <button
                        className="btn-mini"
                        disabled={savingId === g.id}
                        onClick={() => updateLimit(g)}
                      >
                        {savingId === g.id ? '...' : 'Изменить лимит'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
