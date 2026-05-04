import { useState } from 'react';
import { DAY_LABELS_RU, type DayIndex } from '../weeklyPhotos';

const PERIODS = [
  { label: 'Ночь',    hour: 2,  icon: '🌑' },
  { label: 'Рассвет', hour: 6,  icon: '🌅' },
  { label: 'Утро',    hour: 10, icon: '☀️' },
  { label: 'День',    hour: 14, icon: '🌤' },
  { label: 'Закат',   hour: 18, icon: '🌇' },
  { label: 'Вечер',   hour: 20, icon: '🌙' },
];

const DAY_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0]; // Mon-first

interface Props {
  currentHour: number | undefined;
  currentDay: DayIndex | undefined;
  onHourChange: (hour: number | undefined) => void;
  onDayChange: (day: DayIndex | undefined) => void;
}

export default function DevTimePanel({ currentHour, currentDay, onHourChange, onDayChange }: Props) {
  const [hidden, setHidden] = useState(true);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        title="Показать dev-панель"
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9999,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚙
      </button>
    );
  }

  const wrap: React.CSSProperties = {
    position: 'fixed',
    bottom: 44,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: '8px 10px',
    alignItems: 'center',
  };

  const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center' };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 2,
  };

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.68rem',
    fontWeight: 600,
    transition: 'all 0.15s',
    background: active ? 'rgba(255,255,255,0.25)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
  });

  return (
    <div style={wrap}>
      <button
        onClick={() => setHidden(true)}
        title="Скрыть dev-панель"
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(0,0,0,0.85)',
          color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          lineHeight: 1,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
      <div style={row}>
        <span style={labelStyle}>DEV</span>
        {PERIODS.map(p => {
          const active = currentHour === p.hour;
          return (
            <button
              key={p.hour}
              onClick={() => onHourChange(active ? undefined : p.hour)}
              style={{ ...btn(active), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 9px' }}
            >
              <span style={{ fontSize: '1rem' }}>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </div>
      <div style={row}>
        <span style={labelStyle}>DAY</span>
        {DAY_ORDER.map(d => {
          const active = currentDay === d;
          return (
            <button
              key={d}
              onClick={() => onDayChange(active ? undefined : d)}
              style={btn(active)}
            >
              {DAY_LABELS_RU[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
