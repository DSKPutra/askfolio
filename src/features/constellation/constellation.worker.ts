// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Index Constellation renderer (§10.0.1) — Canvas 2D on an OffscreenCanvas in a Web Worker, ≤ 30 fps.
// One orchestrated moment: lines draw from the core outward once (≤ 1.2 s), then everything rests (no glow, no
// breathing — "Obligasi & Brankas" theme). Nodes are ink dots in --data whose opacity encodes freshness, with a status
// ring; the selected node uses --primary. The page pauses the loop when the tab is hidden, the canvas is off-screen, or
// motion is reduced (then a single static frame is drawn).
import type { CEdge, CNode } from './layout';

type Init = { type: 'init'; canvas: OffscreenCanvas; nodes: CNode[]; edges: CEdge[]; w: number; h: number; dpr: number; reduced: boolean; colors: Colors };
type Colors = { data: string; primary: string; edge: string; hues: string[]; muted: string; bg: string };
type Msg = Init | { type: 'run'; running: boolean } | { type: 'resize'; w: number; h: number; dpr: number } | { type: 'dim'; ids: string[] | null } | { type: 'focus'; id: string | null } | { type: 'colors'; colors: Colors };

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvas: OffscreenCanvas | null = null;
let nodes: CNode[] = [];
let edges: CEdge[] = [];
let colors: Colors;
let size = { w: 1, h: 1, dpr: 1 };
let reduced = false;
let running = false;
let dimmed: Set<string> | null = null;
let focused: string | null = null;
let start = 0;
let last = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const FRAME = 1000 / 30;
const INTRO = 1200;

const sx = (x: number) => (x / 1000) * size.w;
const sy = (y: number) => (y / 600) * size.h;

function draw(t: number) {
  if (!ctx) return;
  const c = ctx;
  c.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  c.clearRect(0, 0, size.w, size.h);
  const intro = reduced ? 1 : Math.min(1, t / INTRO);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const core = nodes.find((n) => n.core);
  const maxD = Math.max(1, ...nodes.map((n) => (core ? Math.hypot(n.x - core.x, n.y - core.y) : 0)));
  for (const e of edges) {
    const a = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a || !b) continue;
    const dA = core ? Math.hypot(a.x - core.x, a.y - core.y) / maxD : 0;
    const p = Math.max(0, Math.min(1, (intro - dA * 0.6) / 0.4));
    if (p <= 0) continue;
    const off = dimmed && (dimmed.has(a.id) || dimmed.has(b.id));
    c.globalAlpha = off ? 0.12 : e.kind === 'group' ? 0.55 : 1;
    c.strokeStyle = e.kind === 'group' && e.gi >= 0 ? (colors.hues[e.gi] ?? colors.edge) : colors.edge;
    c.lineWidth = e.kind === 'core' ? 1.75 : 1.5;
    c.setLineDash(e.kind === 'relation' ? [3, 4] : []);
    c.beginPath();
    c.moveTo(sx(a.x), sy(a.y));
    c.lineTo(sx(a.x + (b.x - a.x) * p), sy(a.y + (b.y - a.y) * p));
    c.stroke();
  }
  c.setLineDash([]);
  for (const n of nodes) {
    const off = dimmed?.has(n.id);
    const sel = n.id === focused;
    const r = n.core ? 9 : 6;
    // ink dot: opacity = freshness of the as-of date
    c.globalAlpha = off ? 0.15 : 0.35 + n.brightness * 0.65;
    c.fillStyle = sel ? colors.primary : colors.data;
    c.beginPath();
    c.arc(sx(n.x), sy(n.y), r, 0, Math.PI * 2);
    c.fill();
    // status ring: live solid, partial dashed, pending-data none
    c.globalAlpha = off ? 0.15 : 0.9;
    c.strokeStyle = sel ? colors.primary : colors.muted;
    c.lineWidth = sel ? 2.5 : 1.2;
    c.setLineDash(n.status === 'partial' ? [3, 3] : []);
    if (n.status !== 'pending-data' || sel) {
      c.beginPath();
      c.arc(sx(n.x), sy(n.y), r + 5, 0, Math.PI * 2);
      c.stroke();
    }
    c.setLineDash([]);
  }
  c.globalAlpha = 1;
}

function loop() {
  timer = null;
  if (!running) return;
  const now = performance.now();
  const t = now - start;
  if (now - last >= FRAME) {
    last = now;
    draw(t);
  }
  // Only the intro animates; afterwards everything rests.
  if (t < INTRO) timer = setTimeout(loop, FRAME);
  else draw(INTRO);
}

function kick() {
  if (timer === null && running) timer = setTimeout(loop, 0);
}

self.onmessage = (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  if (m.type === 'init') {
    canvas = m.canvas;
    ctx = canvas.getContext('2d');
    nodes = m.nodes;
    edges = m.edges;
    colors = m.colors;
    reduced = m.reduced;
    size = { w: m.w, h: m.h, dpr: m.dpr };
    canvas.width = Math.round(m.w * m.dpr);
    canvas.height = Math.round(m.h * m.dpr);
    start = performance.now();
    draw(reduced ? INTRO : 0);
  } else if (m.type === 'run') {
    running = m.running && !reduced;
    if (running) kick();
    else draw(performance.now() - start);
  } else if (m.type === 'resize' && canvas) {
    size = { w: m.w, h: m.h, dpr: m.dpr };
    canvas.width = Math.round(m.w * m.dpr);
    canvas.height = Math.round(m.h * m.dpr);
    draw(performance.now() - start);
  } else if (m.type === 'dim') {
    dimmed = m.ids ? new Set(m.ids) : null;
    draw(performance.now() - start);
  } else if (m.type === 'focus') {
    focused = m.id;
    draw(performance.now() - start);
  } else if (m.type === 'colors') {
    colors = m.colors;
    draw(performance.now() - start);
  }
};
