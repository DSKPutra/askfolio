// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Chat orchestration loop (§8.3): system + tools → stream text → run tools (deterministic, read-only,
// 8 s timeout, ≤ 12 calls) → SSE artifacts / method / citations → repeat (≤ 8 turns) → done.
import { getDex } from '../../src/config/dex-registry';
import { LIMITS } from '../../src/shared/chat-protocol';
import type { ChatRequest, Citation, SseEvent } from '../../src/shared/chat-protocol';
import { detectSensitive } from '../../src/shared/text';
import type { DataStore } from '../data/store';
import { toolsFor } from '../dex/index';
import { apiSchema, modelCopy, ToolError, tr } from '../tools/kit';
import type { ManifestLike, ToolCtx, ToolDef } from '../tools/kit';
import type { Block, Llm } from './llm';
import { systemPrompt } from './prompts';

export type OrchestratorDeps = {
  llm: Llm;
  store: DataStore;
  manifest: () => Promise<ManifestLike>;
  deadlineMs: number;
  distribution: 'noncommercial' | 'commercial';
  appVersion: string;
  now?: () => number;
  log?: (rec: Record<string, unknown>) => void;
};

export type ToolUse = { id: string; name: string; input: unknown };

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new ToolError(`${label} timed out after ${ms} ms; try a narrower request.`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Run one tool call; never throws — errors become instructive `is_error` results. */
export async function runTool(tools: ToolDef[], use: ToolUse, ctx: ToolCtx) {
  const def = tools.find((t) => t.name === use.name);
  if (!def) return { error: `Tool "${use.name}" is not available in this Dex. Available: ${tools.map((t) => t.name).join(', ')}` };
  const parsed = def.input.safeParse(use.input);
  if (!parsed.success) return { error: `Invalid input for ${use.name}: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}` };
  try {
    return { result: await withTimeout(def.run(parsed.data, ctx), LIMITS.toolTimeoutMs, use.name) };
  } catch (e) {
    if (e instanceof ToolError) return { error: e.message };
    const msg = e instanceof Error && /Data file not available/.test(e.message) ? 'The data file for this request is not available right now; try another question.' : 'The tool failed unexpectedly; try rephrasing or a different entity.';
    return { error: msg };
  }
}

const SENSITIVE_REPLY = {
  id: 'Pesan Anda tampaknya memuat data sensitif (OTP/PIN, nomor rekening atau kartu, NIK, seed phrase, atau private key). Demi keamanan, Finandex tidak memproses data tersebut. Hapus data itu dari pesan dan jangan pernah membagikan OTP, PIN, seed phrase, atau private key kepada siapa pun — bank, OJK, dan IASC tidak pernah memintanya.',
  en: 'Your message appears to contain sensitive data (OTP/PIN, account or card number, national ID, seed phrase, or private key). For your safety, Finandex does not process it. Please remove it and never share an OTP, PIN, seed phrase, or private key with anyone — banks, OJK, and IASC never ask for them.',
};
/** Extra line for the law & consumer-protection Dex (§12.6: Finandex never collects or forwards reports). */
const SENSITIVE_LAW_NOTE = {
  id: ' Finandex tidak meneruskan laporan dan bukan IASC; laporan resmi hanya di iasc.ojk.go.id, diisi sendiri oleh Anda. Untuk menyiapkan laporan tanpa mengirim data, pakai "Siapkan Laporan" di AntiScamDex (tersimpan hanya di perangkat).',
  en: ' Finandex does not forward reports and is not IASC; official reports only at iasc.ojk.go.id, filed by you. To prepare a report without sending data, use "Prepare a Report" in AntiScamDex (stored only on your device).',
};

export async function orchestrate(req: ChatRequest, deps: OrchestratorDeps, emit: (e: SseEvent) => void, signal: AbortSignal, requestId: string): Promise<void> {
  const now = deps.now ?? Date.now;
  const t0 = now();
  const manifest = await deps.manifest().catch(() => null);
  const dex = getDex(req.dex)!;
  const asOf = manifest?.dex[req.dex]?.as_of ?? dex.asOf;
  emit({ event: 'meta', data: { requestId, dex: req.dex, as_of: asOf, model: deps.llm.model } });

  const last = req.messages.at(-1)!;
  if (detectSensitive(last.content).length) {
    const law = req.dex === 'antiscamdex' || req.dex === 'finlaiwyer' || req.dex === 'mylaiwyer';
    emit({ event: 'text', data: { delta: SENSITIVE_REPLY[req.locale] + (law ? SENSITIVE_LAW_NOTE[req.locale] : '') } });
    emit({ event: 'done', data: { usage: { input_tokens: 0, output_tokens: 0 }, tools_used: [], elapsed_ms: now() - t0 } });
    return;
  }

  const tools = toolsFor(req.dex, deps.store);
  const ctx: ToolCtx = { dex: req.dex, locale: req.locale, store: deps.store, manifest: deps.manifest, distribution: deps.distribution, appVersion: deps.appVersion };
  const specs = tools.map((t) => ({ name: t.name, description: t.description, input_schema: apiSchema(t.input) }));
  const system = systemPrompt(req.dex, req.locale, manifest);
  const messages: { role: 'user' | 'assistant'; content: unknown }[] = req.messages.map((m) => ({ role: m.role, content: m.content }));
  if (req.context) {
    const c = req.context;
    const note = [c.entity && `entity: ${c.entity}`, c.view && `view: ${c.view}`, c.period && `period: ${c.period.start ?? '…'} → ${c.period.end ?? '…'}`].filter(Boolean).join('; ');
    if (note) messages[messages.length - 1] = { role: 'user', content: [{ type: 'text', text: last.content }, { type: 'text', text: `[Screen context — ${note}]` }] };
  }

  const usage = { input_tokens: 0, output_tokens: 0 };
  const toolsUsed: string[] = [];
  const citations = new Map<string, Citation>();
  let toolCalls = 0;

  emit({ event: 'status', data: { code: 'thinking', label: tr(req.locale, 'Berpikir…', 'Thinking…') } });
  for (let turn = 1; turn <= LIMITS.turns; turn++) {
    const res = await deps.llm.turn({ system, tools: specs, messages, signal, onText: (delta) => emit({ event: 'text', data: { delta } }) });
    usage.input_tokens += res.usage.input_tokens;
    usage.output_tokens += res.usage.output_tokens;
    if (res.stop_reason === 'refusal') {
      emit({ event: 'text', data: { delta: tr(req.locale, '\n\nMaaf, saya tidak dapat membantu permintaan ini.', '\n\nSorry, I cannot help with this request.') } });
      break;
    }
    const uses = res.content.filter((b): b is Extract<Block, { type: 'tool_use' }> => b.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || !uses.length) break;
    messages.push({ role: 'assistant', content: res.content });
    const results: { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }[] = [];
    for (const use of uses) {
      if (toolCalls >= LIMITS.toolCallsPerRequest) {
        results.push({ type: 'tool_result', tool_use_id: use.id, is_error: true, content: 'Tool-call limit reached for this request; answer with the data already retrieved.' });
        continue;
      }
      toolCalls++;
      const def = tools.find((t) => t.name === use.name);
      emit({ event: 'status', data: { code: 'tool', tool: use.name, label: def ? def.label[req.locale] : use.name } });
      const out = await runTool(tools, use, ctx);
      if ('error' in out) {
        deps.log?.({ requestId, dex: req.dex, tool: use.name, error: true });
        results.push({ type: 'tool_result', tool_use_id: use.id, is_error: true, content: out.error! });
        continue;
      }
      const r = out.result!;
      toolsUsed.push(use.name);
      for (const a of r.ui ?? []) emit({ event: 'artifact', data: a });
      if (r.method) emit({ event: 'method', data: r.method });
      for (const c of r.citations ?? []) citations.set(JSON.stringify(c), c);
      results.push({ type: 'tool_result', tool_use_id: use.id, content: modelCopy(r.data, LIMITS.modelCopyBytes) });
    }
    messages.push({ role: 'user', content: results });
    if (now() - t0 > deps.deadlineMs) {
      emit({ event: 'text', data: { delta: tr(req.locale, '\n\n(Waktu habis — jawaban dihentikan. Silakan persempit pertanyaan.)', '\n\n(Time limit reached — answer stopped. Please narrow the question.)') } });
      break;
    }
  }
  for (const c of citations.values()) emit({ event: 'citation', data: c });
  deps.log?.({ requestId, dex: req.dex, tools: toolsUsed, ...usage, ms: now() - t0 });
  emit({ event: 'done', data: { usage, tools_used: toolsUsed, elapsed_ms: now() - t0 } });
}
