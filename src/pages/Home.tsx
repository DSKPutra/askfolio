// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Beranda Askfolio — kept deliberately short: (1) the question box with three suggestions on a bright card; (2) the risk
// profile — a call to action until it is done, then the matching asset classes; (3) four asset-class shortcuts;
// (4) one protection row (scam emergency, financial rights); (5) a link to every dataset (/data).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { DexIcon } from '../components/DexCard';
import { DexName } from '../components/DexName';
import { EmergencyScamButton } from '../components/EmergencyScamButton';
import { Button, Card, Chip } from '../components/ui';
import { DEX_REGISTRY } from '../config/dex-registry';
import { useLocale } from '../lib/locale';
import { useApp } from '../lib/store';
import { ProfileResult } from './RiskProfile';

const T = {
  title: { id: 'Tanya apa saja soal investasimu', en: 'Ask anything about your investments' },
  sub: { id: 'Jawaban dengan angka terverifikasi dari data, lengkap dengan grafik dan sumbernya. Bukan nasihat investasi.', en: 'Answers with verified numbers from the data, with charts and sources. Not investment advice.' },
  placeholder: { id: 'Misal: reksa dana pasar uang mana yang paling stabil?', en: 'E.g. which money-market funds have been the most stable?' },
  ask: { id: 'Tanya', en: 'Ask' },
  profileCta: { id: 'Kenali profil risikomu', en: 'Find your risk profile' },
  profileCtaSub: { id: '8 pertanyaan singkat. Askfolio lalu menunjukkan kelas aset yang umumnya cocok untukmu.', en: '8 questions, 2 minutes. Askfolio then shows the asset classes that usually fit you.' },
  start: { id: 'Mulai', en: 'Start' },
  details: { id: 'Lihat detail & ulangi', en: 'Details & retake' },
  data: { id: 'Pelajari kelas aset', en: 'Study asset classes' },
  protect: { id: 'Lindungi dirimu', en: 'Protect yourself' },
  explore: { id: 'Jelajah semua data (29 topik)', en: 'Explore all data (29 topics)' },
} as const;

const SUGGEST = {
  id: ['Reksa dana pasar uang paling stabil', 'Saham Indonesia terkuat tahun ini', 'Kurs USD/IDR terbaru'],
  en: ['Most stable money-market funds', 'Strongest Indonesian stocks this year', 'Latest USD/IDR rate'],
} as const;
const SUGGEST_DEX = ['reksadex', 'idxdex', 'rupiahdex'] as const;
const CLASSES = ['reksadex', 'idxdex', 'rupiahdex', 'inflationdex'] as const;

export default function Home() {
  const L = useLocale();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const profile = useApp((s) => s.riskProfile);
  const ask = (text: string, dex = 'finandex-ai') => void nav(`/dex/${dex}/chat?q=${encodeURIComponent(text)}`);
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section aria-labelledby="hero-title" className="rounded-[28px] bg-[color-mix(in_srgb,var(--primary)_9%,var(--pane))] px-5 py-8 text-center sm:px-10">
        <h1 id="hero-title" className="font-display text-3xl sm:text-4xl">
          {T.title[L]}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-muted">{T.sub[L]}</p>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) ask(q.trim());
          }}
        >
          <label htmlFor="hero-ask" className="sr-only">
            {T.placeholder[L]}
          </label>
          <input id="hero-ask" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.placeholder[L]} className="min-h-14 flex-1 rounded-xl border border-edge bg-pane px-4 text-base focus:border-primary" />
          <Button type="submit" variant="primary" size="lg">
            {T.ask[L]}
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGEST[L].map((s, i) => (
            <Chip key={s} onClick={() => ask(s, SUGGEST_DEX[i])}>
              {s}
            </Chip>
          ))}
        </div>
      </section>

      <Card className="p-5">
        {profile ? (
          <div className="space-y-3">
            <ProfileResult level={profile.level} compact />
            <Link to="/profil-risiko" className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-2 hover:underline">
              {T.details[L]} →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl">{T.profileCta[L]}</h2>
              <p className="text-sm text-ink-muted">{T.profileCtaSub[L]}</p>
            </div>
            <Link to="/profil-risiko" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-medium text-on-primary">
              {T.start[L]}
            </Link>
          </div>
        )}
      </Card>

      <section aria-labelledby="classes-title" className="space-y-3">
        <h2 id="classes-title" className="font-display text-xl">
          {T.data[L]}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CLASSES.map((id) => {
            const d = DEX_REGISTRY.find((x) => x.id === id)!;
            return (
              <Link key={id} to={`/dex/${id}`} className="pane flex flex-col items-start gap-2 p-4 hover:bg-pane-2">
                <DexIcon dex={d} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    <DexName dex={d} />
                  </span>
                                  </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="protect-title" className="pane flex flex-wrap items-center gap-3 p-4">
        <h2 id="protect-title" className="mr-auto text-base font-semibold">
          {T.protect[L]}
        </h2>
        <EmergencyScamButton size="sm" />
        <Link to="/dex/finlaiwyer" className="inline-flex min-h-11 items-center rounded-full border border-edge px-4 text-sm hover:bg-pane-2">
          <DexName dex={DEX_REGISTRY.find((x) => x.id === 'finlaiwyer')!} />
        </Link>
      </section>

      <p className="text-center">
        <Link to="/data" className="inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline">
          {T.explore[L]} →
        </Link>
      </p>
    </div>
  );
}
