import { useState, useEffect } from 'react';
import StarField from './StarField';
import { getPhotoFor, type DayIndex, type DayPeriod } from '../weeklyPhotos';

type ThemePeriod = 'light' | 'dark' | 'sunset';

interface TimeTheme {
  bgImage?: string;
  bgBlur: number;
  bgBrightness: number;
  bgPosition?: string;
  overlay: string;
  gradient?: string;
  glowColor?: string;
  glowX?: string;
  glowY?: string;
  period: ThemePeriod;
  hasStars: boolean;
}

function classifyDaytime(hour: number): DayPeriod | null {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'sunset';
  return null; // evening / night handled by gradients
}

function getTheme(hour: number, day: DayIndex): TimeTheme {
  const slot = classifyDaytime(hour);

  // Night wraps: 21:00 → 05:00
  if (hour >= 21 || hour < 5) {
    return {
      gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
      bgBlur: 0, bgBrightness: 1,
      overlay: 'transparent',
      glowColor: 'rgba(80, 80, 180, 0.2)', glowX: '50%', glowY: '-10%',
      period: 'dark', hasStars: true,
    };
  }
  if (slot === 'dawn') {
    return {
      bgImage: getPhotoFor(day, 'dawn'),
      bgBlur: 5, bgBrightness: 0.94,
      bgPosition: 'center 75%',
      overlay: 'rgba(255, 230, 200, 0.08)',
      period: 'light', hasStars: false,
    };
  }
  if (slot === 'morning') {
    return {
      bgImage: getPhotoFor(day, 'morning'),
      bgBlur: 4, bgBrightness: 1.0,
      bgPosition: 'center 40%',
      overlay: 'rgba(220, 240, 255, 0.08)',
      period: 'light', hasStars: false,
    };
  }
  if (slot === 'afternoon') {
    return {
      bgImage: getPhotoFor(day, 'afternoon'),
      bgBlur: 5, bgBrightness: 1.0,
      bgPosition: 'center 45%',
      overlay: 'rgba(215, 235, 255, 0.08)',
      period: 'light', hasStars: false,
    };
  }
  if (slot === 'sunset') {
    return {
      bgImage: getPhotoFor(day, 'sunset'),
      bgBlur: 6, bgBrightness: 0.88,
      bgPosition: 'center 50%',
      overlay: 'rgba(20, 5, 15, 0.18)',
      period: 'sunset', hasStars: false,
    };
  }
  // Evening: 19:00 – 21:00
  return {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #2c3e50 100%)',
    bgBlur: 0, bgBrightness: 1,
    overlay: 'transparent',
    glowColor: 'rgba(44, 62, 80, 0.35)', glowX: '50%', glowY: '18%',
    period: 'dark', hasStars: true,
  };
}

interface Props {
  hourOverride?: number;
  dayOverride?: DayIndex;
}

export default function DynamicBackground({ hourOverride, dayOverride }: Props) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const [day, setDay] = useState<DayIndex>(() => new Date().getDay() as DayIndex);

  useEffect(() => {
    if (hourOverride !== undefined) return;
    const id = setInterval(() => {
      const now = new Date();
      setHour(now.getHours());
      setDay(now.getDay() as DayIndex);
    }, 60_000);
    return () => clearInterval(id);
  }, [hourOverride]);

  const effectiveHour = hourOverride ?? hour;
  const effectiveDay = dayOverride ?? day;
  const theme = getTheme(effectiveHour, effectiveDay);

  useEffect(() => {
    document.documentElement.dataset.theme = theme.period;
  }, [theme.period]);

  return (
    <div className="dynamic-bg" aria-hidden="true">
      {theme.gradient && (
        <div style={{ position: 'absolute', inset: 0, background: theme.gradient }} />
      )}

      {theme.bgImage && (
        <div style={{
          position: 'absolute',
          inset: '-4%',
          backgroundImage: `url(${theme.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: theme.bgPosition ?? 'center center',
          filter: `blur(${theme.bgBlur}px) brightness(${theme.bgBrightness})`,
        }} />
      )}

      {theme.overlay !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: theme.overlay }} />
      )}

      {theme.glowColor && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 65% 45% at ${theme.glowX} ${theme.glowY}, ${theme.glowColor}, transparent 72%)`,
          pointerEvents: 'none',
        }} />
      )}

      <StarField visible={theme.hasStars} />
    </div>
  );
}
