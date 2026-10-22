// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Tiny SVG sparkline (no chart library on the home screen, to keep the initial bundle small).
export function Sparkline({ values, width = 96, height = 28, label }: { values: number[]; width?: number; height?: number; label?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`).join(' ');
  const up = values.at(-1)! >= values[0]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="shrink-0">
      <polyline points={pts} fill="none" stroke={up ? 'var(--positive)' : 'var(--negative)'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
