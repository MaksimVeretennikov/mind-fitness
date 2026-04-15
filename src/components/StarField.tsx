import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  baseOpacity: number;
}

// Deterministic star field — stable across renders
const STARS: Star[] = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 17.37 + 5.3) * 7.19) % 100,
  y: ((i * 13.71 + 2.9) * 5.83) % 72, // keep stars in upper 72% (sky area)
  size: i % 6 === 0 ? 2.8 : i % 3 === 0 ? 1.8 : 1.1,
  delay: (i * 0.53) % 5,
  duration: 1.6 + (i % 5) * 0.55,
  baseOpacity: 0.35 + (i % 4) * 0.18,
}));

export default function StarField({ visible }: { visible: boolean }) {
  const shootingRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!visible) return;

    function launch() {
      const el = shootingRef.current;
      if (!el) return;
      el.style.top = `${6 + Math.random() * 32}%`;
      el.style.left = `${5 + Math.random() * 55}%`;
      el.classList.remove('shooting-active');
      void el.offsetWidth; // force reflow to restart animation
      el.classList.add('shooting-active');
      timerRef.current = setTimeout(launch, 6000 + Math.random() * 10000);
    }

    timerRef.current = setTimeout(launch, 2500 + Math.random() * 3500);
    return () => clearTimeout(timerRef.current);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="starfield" aria-hidden="true">
      {STARS.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            opacity: star.baseOpacity,
          }}
        />
      ))}
      <div ref={shootingRef} className="shooting-star" />
    </div>
  );
}
