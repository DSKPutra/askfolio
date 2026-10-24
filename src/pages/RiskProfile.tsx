// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// /profil-risiko: the onboarding risk questionnaire (risk appetite vs risk capacity) and its result — matching asset
// classes with links to the data for each. Education only; answers never leave the device (src/shared/risk-profile.ts).
import { clsx } from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card } from '../components/ui';
import { useLocale } from '../lib/locale';
import { useApp } from '../lib/store';
import { RISK_DISCLAIMER, RISK_PROFILES, RISK_QUESTIONS, scoreRisk } from '../shared/risk-profile';
import type { RiskLevel } from '../shared/risk-profile';

const T = {
  title: { id: 'Profil risiko Anda', en: 'Your risk profile' },
  intro: { id: '8 pertanyaan singkat tentang kemauan (risk appetite) dan kemampuan (risk capacity) Anda menanggung risiko. Sekitar 2 menit.', en: '8 short questions on your willingness (risk appetite) and ability (risk capacity) to take risk. About 2 minutes.' },
  appetite: { id: 'Kemauan', en: 'Appetite' },
  capacity: { id: 'Kemampuan', en: 'Capacity' },
  of: { id: 'dari', en: 'of' },
  back: { id: 'Kembali', en: 'Back' },
  next: { id: 'Lanjut', en: 'Next' },
  finish: { id: 'Lihat profil saya', en: 'See my profile' },
  pick: { id: 'Pilih salah satu jawaban dulu.', en: 'Choose an answer first.' },
  yours: { id: 'Profil Anda', en: 'Your profile' },
  why: { id: 'Profil memakai yang lebih rendah antara kemauan dan kemampuan, agar risiko tidak melebihi apa yang sanggup Anda tanggung.', en: 'Your profile is the lower of appetite and capacity, so risk never exceeds what you can afford.' },
  suitable: { id: 'Kelas aset yang umumnya sesuai', en: 'Asset classes that usually fit' },
  limit: { id: 'Batasi atau hindari', en: 'Limit or avoid' },
  study: { id: 'Pelajari datanya', en: 'Study the data' },
  ask: { id: 'Tanya Askfolio tentang profil ini', en: 'Ask Askfolio about this profile' },
  retake: { id: 'Ulangi kuesioner', en: 'Retake the questionnaire' },
} as const;

export function ProfileResult({ level, compact = false }: { level: RiskLevel; compact?: boolean }) {
  const L = useLocale();
  const p = RISK_PROFILES[level];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{T.yours[L]}</p>
        <p className="font-display text-2xl text-primary">{p.label[L]}</p>
        <p className="measure text-sm text-ink-muted">{p.summary[L]}</p>
      </div>
      <div className={clsx('grid gap-3', !compact && 'sm:grid-cols-2')}>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{T.suitable[L]}</h3>
          <ul className="space-y-2">
            {p.suitable.map((a) => (
              <li key={a.name.en} className="rounded-xl border border-edge bg-pane p-3 text-sm">
                <p className="font-medium">{a.name[L]}</p>
                <p className="text-ink-muted">{a.why[L]}</p>
                {a.dex && !compact && (
                  <Link to={`/dex/${a.dex}`} className="mt-1 inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline">
                    {T.study[L]} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        {!compact && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">{T.limit[L]}</h3>
            <ul className="space-y-2">
              {p.limit.map((a) => (
                <li key={a.name.en} className="rounded-xl border border-edge bg-pane p-3 text-sm">
                  <p className="font-medium text-flag">{a.name[L]}</p>
                  <p className="text-ink-muted">{a.why[L]}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RiskProfile() {
  const L = useLocale();
  const saved = useApp((s) => s.riskProfile);
  const save = useApp((s) => s.setRiskProfile);
  const [answers, setAnswers] = useState<(number | null)[]>(() => saved?.answers ?? RISK_QUESTIONS.map(() => null));
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(!saved);
  const [error, setError] = useState(false);

  if (saved && !editing) {
    const r = scoreRisk(saved.answers);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-3xl">{T.title[L]}</h1>
        <Card className="space-y-4 p-5">
          <ProfileResult level={r.level} />
          <p className="flex flex-wrap gap-2 text-xs text-ink-muted">
            <span className="rounded-full border border-edge px-2 py-0.5">
              {T.appetite[L]}: {RISK_PROFILES[r.appetite].label[L]}
            </span>
            <span className="rounded-full border border-edge px-2 py-0.5">
              {T.capacity[L]}: {RISK_PROFILES[r.capacity].label[L]}
            </span>
          </p>
          <p className="text-xs text-ink-muted">{T.why[L]}</p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Link to={`/dex/finandex-ai/chat?q=${encodeURIComponent(L === 'id' ? `Profil risiko saya ${RISK_PROFILES[r.level].label.id}. Jelaskan dengan data bagaimana naik-turunnya kelas aset yang cocok untuk saya.` : `My risk profile is ${RISK_PROFILES[r.level].label.en}. Using the data, explain how the matching asset classes have moved.`)}`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-on-primary">
            {T.ask[L]}
          </Link>
          <Button
            onClick={() => {
              setStep(0);
              setEditing(true);
            }}
          >
            {T.retake[L]}
          </Button>
        </div>
        <p className="measure text-xs text-ink-muted">{RISK_DISCLAIMER[L]}</p>
      </div>
    );
  }

  const q = RISK_QUESTIONS[step]!;
  const last = step === RISK_QUESTIONS.length - 1;
  const choose = (i: number) => {
    setError(false);
    setAnswers((a) => a.map((x, k) => (k === step ? i : x)));
  };
  const next = () => {
    if (answers[step] === null) return setError(true);
    if (!last) return setStep(step + 1);
    const done = answers as number[];
    save({ answers: done, level: scoreRisk(done).level, at: new Date().toISOString().slice(0, 10) });
    setEditing(false);
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{T.title[L]}</h1>
        <p className="measure text-ink-muted">{T.intro[L]}</p>
      </div>
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            {step + 1} {T.of[L]} {RISK_QUESTIONS.length}
          </span>
          <span>{q.dimension === 'appetite' ? T.appetite[L] : T.capacity[L]}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-pane-2" aria-hidden>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${((step + 1) / RISK_QUESTIONS.length) * 100}%` }} />
        </div>
        <fieldset>
          <legend className="mb-3 text-lg font-medium">{q.text[L]}</legend>
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <label key={o.en} className={clsx('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm', answers[step] === i ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_10%,var(--pane))]' : 'border-edge bg-pane hover:bg-pane-2')}>
                <input type="radio" name={q.id} checked={answers[step] === i} onChange={() => choose(i)} className="accent-[var(--primary)]" />
                {o[L]}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-negative">
            {T.pick[L]}
          </p>
        )}
        <div className="flex justify-between gap-2">
          <Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            {T.back[L]}
          </Button>
          <Button variant="primary" onClick={next}>
            {last ? T.finish[L] : T.next[L]}
          </Button>
        </div>
      </Card>
      <p className="measure text-xs text-ink-muted">{RISK_DISCLAIMER[L]}</p>
    </div>
  );
}
