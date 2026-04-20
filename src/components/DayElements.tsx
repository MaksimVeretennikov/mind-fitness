export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'sunset';

interface SunCfg {
  x: string; y: string;
  size: number;
  core: string;
  glow: string;
  ray: string;
}

interface CloudCfg {
  x: number; y: number;
  w: number; h: number;
  speed: number; delay: number;
  opacity: number; blur: number;
}

const SUN: Record<DayPeriod, SunCfg> = {
  dawn: {
    x: '13%', y: '83%', size: 64,
    core: 'radial-gradient(circle at 36% 36%, #ffecd2, #ffaa70, #e05528)',
    glow: 'rgba(240, 110, 60, 0.42)',
    ray:  'rgba(255, 140, 80, 0.18)',
  },
  morning: {
    x: '80%', y: '13%', size: 76,
    core: 'radial-gradient(circle at 36% 36%, #ffffff, #fff8a0, #ffd030)',
    glow: 'rgba(255, 215, 50, 0.44)',
    ray:  'rgba(255, 232, 100, 0.20)',
  },
  afternoon: {
    x: '50%', y: '7%', size: 86,
    core: 'radial-gradient(circle at 36% 36%, #ffffff, #fffbe0, #ffe640)',
    glow: 'rgba(255, 242, 80, 0.50)',
    ray:  'rgba(255, 245, 120, 0.22)',
  },
  sunset: {
    x: '84%', y: '74%', size: 70,
    core: 'radial-gradient(circle at 36% 36%, #ffd080, #ff6840, #c02820)',
    glow: 'rgba(210, 65, 25, 0.44)',
    ray:  'rgba(255, 100, 45, 0.20)',
  },
};

// 4 clouds – start off-screen left, drift rightward with negative delay to distribute
const CLOUDS: CloudCfg[] = [
  { x: -340, y: 10, w: 380, h: 90,  speed: 145, delay: -20,  opacity: 1, blur: 22 },
  { x: -340, y: 17, w: 280, h: 72,  speed: 190, delay: -75,  opacity: 0.85, blur: 18 },
  { x: -340, y: 5,  w: 320, h: 80,  speed: 165, delay: -115, opacity: 0.7, blur: 25 },
  { x: -340, y: 23, w: 220, h: 58,  speed: 215, delay: -160, opacity: 0.6, blur: 16 },
];

function Sun({ cfg }: { cfg: SunCfg }) {
  const glowSz = cfg.size * 3.8;
  const raysSz = cfg.size * 4.6;

  return (
    <div style={{ position: 'absolute', left: cfg.x, top: cfg.y, transform: 'translate(-50%,-50%)', width: cfg.size, height: cfg.size }}>
      {/* Outer diffuse glow */}
      <div style={{ position: 'absolute', width: glowSz, height: glowSz, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 65%)`, animation: 'sunPulse 5s ease-in-out infinite' }} />
      </div>

      {/* Rotating ray burst */}
      <div style={{ position: 'absolute', width: raysSz, height: raysSz, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: `conic-gradient(
            ${cfg.ray} 0deg,   transparent 12deg,
            ${cfg.ray} 30deg,  transparent 42deg,
            ${cfg.ray} 60deg,  transparent 72deg,
            ${cfg.ray} 90deg,  transparent 102deg,
            ${cfg.ray} 120deg, transparent 132deg,
            ${cfg.ray} 150deg, transparent 162deg,
            ${cfg.ray} 180deg, transparent 192deg,
            ${cfg.ray} 210deg, transparent 222deg,
            ${cfg.ray} 240deg, transparent 252deg,
            ${cfg.ray} 270deg, transparent 282deg,
            ${cfg.ray} 300deg, transparent 312deg,
            ${cfg.ray} 330deg, transparent 342deg
          )`,
          animation: 'sunRotate 42s linear infinite',
        }} />
      </div>

      {/* Secondary shimmer rays (offset 15deg, slower) */}
      <div style={{ position: 'absolute', width: raysSz * 0.82, height: raysSz * 0.82, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: `conic-gradient(
            transparent 0deg,  ${cfg.ray} 15deg,  transparent 26deg,
            transparent 45deg, ${cfg.ray} 60deg,  transparent 71deg,
            transparent 90deg, ${cfg.ray} 105deg, transparent 116deg,
            transparent 135deg,${cfg.ray} 150deg, transparent 161deg,
            transparent 180deg,${cfg.ray} 195deg, transparent 206deg,
            transparent 225deg,${cfg.ray} 240deg, transparent 251deg,
            transparent 270deg,${cfg.ray} 285deg, transparent 296deg,
            transparent 315deg,${cfg.ray} 330deg, transparent 341deg
          )`,
          opacity: 0.6,
          animation: 'sunRotate 60s linear infinite reverse',
        }} />
      </div>

      {/* Sun core */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: cfg.core,
        boxShadow: `0 0 ${cfg.size * 0.55}px ${cfg.size * 0.18}px ${cfg.glow}`,
        animation: 'sunCorePulse 4s ease-in-out infinite',
      }} />
    </div>
  );
}

function Cloud({ c, color }: { c: CloudCfg; color: string }) {
  return (
    <div style={{
      position: 'absolute',
      left: c.x,
      top: `${c.y}%`,
      width: c.w,
      height: c.h,
      opacity: c.opacity,
      filter: `blur(${c.blur}px)`,
      animation: `cloudDrift ${c.speed}s linear ${c.delay}s infinite`,
      willChange: 'transform',
    }}>
      {/* Main pill body */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', borderRadius: 100, background: color }} />
      {/* Left bump */}
      <div style={{ position: 'absolute', bottom: '38%', left: '15%', width: '36%', height: '72%', borderRadius: '50%', background: color }} />
      {/* Center bump (tallest) */}
      <div style={{ position: 'absolute', bottom: '38%', left: '36%', width: '30%', height: '90%', borderRadius: '50%', background: color }} />
      {/* Right bump */}
      <div style={{ position: 'absolute', bottom: '38%', left: '58%', width: '26%', height: '62%', borderRadius: '50%', background: color }} />
    </div>
  );
}

const CLOUD_COLORS: Record<DayPeriod, string> = {
  dawn:      'rgba(255, 230, 210, 0.38)',
  morning:   'rgba(255, 255, 255, 0.42)',
  afternoon: 'rgba(255, 255, 255, 0.46)',
  sunset:    'rgba(255, 200, 150, 0.36)',
};

export default function DayElements({ period }: { period: DayPeriod }) {
  const sun = SUN[period];
  const cloudColor = CLOUD_COLORS[period];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <Sun cfg={sun} />
      {CLOUDS.map((c, i) => <Cloud key={i} c={c} color={cloudColor} />)}
    </div>
  );
}
