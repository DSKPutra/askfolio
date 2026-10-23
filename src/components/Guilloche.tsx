// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Guilloche texture (THEME_RECOLOR_PROMPT §2, §4.4): fine interlaced waves like a share certificate, generated
// deterministically (no randomness), drawn in --data at ≤ 6 % opacity, only on the home hero and the whitepaper cover.
// Turned off in high-contrast mode (--guilloche-opacity: 0). Static, so reduced-motion is irrelevant.
import { useMemo } from 'react';

export function guillochePaths(w = 1200, h = 360, lines = 18): string[] {
  const out: string[] = [];
  for (let k = 0; k < lines; k++) {
    const amp = 18 + (k % 6) * 7;
    const f1 = 0.008 + (k % 4) * 0.0015;
    const f2 = 0.021 + (k % 5) * 0.0011;
    const y0 = (h / (lines + 1)) * (k + 1);
    const pts: string[] = [];
    for (let x = 0; x <= w; x += 6) {
      const y = y0 + Math.sin(x * f1 + k * 0.7) * amp + Math.sin(x * f2 + k * 1.3) * amp * 0.35;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    out.push(`M${pts.join(' L')}`);
  }
  return out;
}

export function Guilloche({ className }: { className?: string }) {
  const paths = useMemo(() => guillochePaths(), []);
  return (
    <svg aria-hidden viewBox="0 0 1200 360" preserveAspectRatio="none" className={className} style={{ opacity: 'var(--guilloche-opacity)' }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--data)" strokeWidth={0.8} />
      ))}
    </svg>
  );
}
