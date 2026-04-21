import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Attempt {
  id: string;
  created_at: string;
  details: Record<string, unknown>;
}

interface ChoiceMistake { display: string; chosen: string; correct: string }
interface AbbrMistake { abbr: string; full: string }

interface Props {
  exerciseName: string;
  /** Button label override */
  label?: string;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const ds = new Date(d); ds.setHours(0,0,0,0);
  const hm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (ds.getTime() === today.getTime()) return `Сегодня, ${hm}`;
  if (ds.getTime() === yest.getTime()) return `Вчера, ${hm}`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' }) + `, ${hm}`;
}

type View = 'history' | 'all';

export default function MistakesHistory({ exerciseName, label = 'История ошибок' }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('history');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from('exercise_results')
      .select('id, created_at, details')
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAttempts((data as Attempt[]) ?? []);
        setLoading(false);
      });
  }, [open, user, exerciseName]);

  const isAbbr = exerciseName === 'abbreviations';

  // Aggregated mistake list: unique + counts
  const aggregated = useMemo(() => {
    if (isAbbr) {
      const map = new Map<string, { abbr: string; full: string; count: number }>();
      for (const a of attempts) {
        const ms = (a.details as { mistakes?: unknown })?.mistakes;
        if (!Array.isArray(ms)) continue;
        for (const m of ms as AbbrMistake[]) {
          if (!m?.abbr) continue;
          const key = `${m.abbr}|${m.full}`;
          const prev = map.get(key);
          if (prev) prev.count += 1;
          else map.set(key, { abbr: m.abbr, full: m.full, count: 1 });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    } else {
      const map = new Map<string, { display: string; correct: string; chosen: string; count: number }>();
      for (const a of attempts) {
        const ms = (a.details as { mistakes?: unknown })?.mistakes;
        if (!Array.isArray(ms)) continue;
        for (const m of ms as ChoiceMistake[]) {
          if (!m?.display) continue;
          const key = `${m.display}|${m.correct}`;
          const prev = map.get(key);
          if (prev) prev.count += 1;
          else map.set(key, { display: m.display, correct: m.correct, chosen: m.chosen, count: 1 });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }
  }, [attempts, isAbbr]);

  const copyText = useMemo(() => {
    if (isAbbr) {
      return (aggregated as Array<{ abbr: string; full: string; count: number }>)
        .map((m) => `${m.abbr} — ${m.full}${m.count > 1 ? ` (×${m.count})` : ''}`)
        .join('\n');
    }
    return (aggregated as Array<{ display: string; correct: string; count: number }>)
      .map((m) => `${m.display} → ${m.correct}${m.count > 1 ? ` (×${m.count})` : ''}`)
      .join('\n');
  }, [aggregated, isAbbr]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  if (!user) return null;

  const modal = open ? (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setView('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                🗂️ История
              </button>
              <button
                onClick={() => setView('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                📝 Все ошибки
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-gray-500 text-xl leading-none"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-4 flex-1">
            {loading ? (
              <div className="text-center text-gray-500 py-10">Загрузка…</div>
            ) : view === 'history' ? (
              attempts.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Ещё нет попыток — пройдите упражнение
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {attempts.map((a) => {
                    const mistakes = (a.details as { mistakes?: unknown })?.mistakes;
                    const hasMistakes = Array.isArray(mistakes) && mistakes.length > 0;
                    const total = (a.details as { total?: number })?.total;
                    const correct = (a.details as { correct?: number })?.correct;
                    return (
                      <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500 font-medium">{fmtDate(a.created_at)}</span>
                          {typeof total === 'number' && typeof correct === 'number' && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                correct / total >= 0.8
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : correct / total >= 0.5
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {correct} / {total}
                            </span>
                          )}
                        </div>
                        {!hasMistakes ? (
                          <div className="text-sm text-gray-500">
                            {isAbbr ? '🎉 Все аббревиатуры знал' : '🎉 Без ошибок'}
                          </div>
                        ) : isAbbr ? (
                          <div className="flex flex-col gap-1">
                            {(mistakes as AbbrMistake[]).map((m, i) => (
                              <div
                                key={i}
                                className="flex items-start justify-between gap-3 text-sm py-1 border-b border-gray-100 last:border-0"
                              >
                                <span className="font-bold text-gray-800 tracking-wide shrink-0">{m.abbr}</span>
                                <span className="text-gray-600 text-right leading-snug">{m.full}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {(mistakes as ChoiceMistake[]).map((m, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-3 text-sm py-1 border-b border-gray-100 last:border-0"
                              >
                                <span className="text-gray-500 shrink-0">{m.display}</span>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-lg line-through">
                                    {m.chosen}
                                  </span>
                                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                                    {m.correct}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : aggregated.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Пока нет ошибок — все ответы верные!</div>
            ) : (
              <div className="flex flex-col gap-1">
                {isAbbr
                  ? (aggregated as Array<{ abbr: string; full: string; count: number }>).map((m, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="font-bold text-gray-800 tracking-wide shrink-0">{m.abbr}</span>
                        <div className="flex items-center gap-2 text-right leading-snug">
                          <span className="text-gray-600">{m.full}</span>
                          {m.count > 1 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md shrink-0">
                              ×{m.count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  : (aggregated as Array<{ display: string; correct: string; count: number }>).map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-600 shrink-0">{m.display}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                            {m.correct}
                          </span>
                          {m.count > 1 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">
                              ×{m.count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>

          {view === 'all' && aggregated.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between gap-3 bg-gray-50">
              <span className="text-xs text-gray-500">Всего уникальных: {aggregated.length}</span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all active:scale-95"
              >
                {copied ? '✓ Скопировано' : '📋 Скопировать список'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
        <button
          type="button"
          onClick={() => { setView('history'); setOpen(true); }}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>🗂️</span>
          <span>{label}</span>
        </button>
        <button
          type="button"
          onClick={() => { setView('all'); setOpen(true); }}
          className="inline-flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl glass hover:bg-white/80 text-gray-700 text-sm md:text-base font-medium transition-all active:scale-95 border border-white/60"
        >
          <span>📝</span>
          <span>Все ошибки</span>
        </button>
      </div>
      {modal && createPortal(modal, document.body)}
    </>
  );
}
