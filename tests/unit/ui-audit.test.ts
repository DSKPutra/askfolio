// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ui:audit rules (THEME_RECOLOR_PROMPT §5): neon, legacy tokens, glow, gradients and literal colours are flagged.
import { describe, expect, it } from 'vitest';
import { auditText } from '../../scripts/ui/audit';

const rules = (file: string, text: string) => auditText(file, text).map((f) => f.rule);

describe('ui:audit', () => {
  it('flags the old neon theme', () => {
    expect(rules('src/x.tsx', "const c = '#19F23A';")).toContain('legacy-neon-hex');
    expect(rules('src/x.tsx', '<p className="text-phosphor-text border-coral" />')).toContain('legacy-token-name');
    expect(rules('src/x.tsx', '<p className="glow-focus" />')).toContain('legacy-token-name');
  });
  it('flags glow and decorative gradients', () => {
    expect(rules('src/x.css', '  background: radial-gradient(circle, red, blue);')).toContain('decorative-gradient');
    expect(rules('src/x.css', '  filter: drop-shadow(0 0 8px #0f0);')).toContain('glow');
  });
  it('flags literal colours and Tailwind palette classes outside token files', () => {
    expect(rules('src/x.tsx', "color: '#13261C'")).toContain('literal-colour');
    expect(rules('src/x.tsx', 'className="bg-green-500"')).toContain('tailwind-palette');
    expect(rules('src/config/brand.ts', "ink: '#13261C',")).toEqual([]);
    expect(rules('src/styles/index.css', '  --ink: #13261c;')).toEqual([]);
  });
  it('accepts token utilities and comments', () => {
    expect(rules('src/x.tsx', '<p className="bg-primary text-on-primary border-edge text-flag" />')).toEqual([]);
    expect(rules('src/x.tsx', '// replaced the old #19F23A glow')).toEqual([]);
  });
});
