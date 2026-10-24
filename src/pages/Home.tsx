// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Beranda Askfolio (2026-10-25): an AI investing assistant for Indonesian retail investors. (1) one big question box with
// investor suggestions; (2) the risk profile — a call to action until it is done, then the matching asset classes;
// (3) data shortcuts for the classes retail investors use most; (4) global market summary; (5) protection tools
// (scam emergency, financial rights) as secondary actions; (6) a link to every dataset (/data).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { DexIcon } from '../components/DexCard';
import { DexName } from '../components/DexName';
import { EmergencyScamButton } from '../components/EmergencyScamButton';
import { Button, Card, Chip } from '../components/ui';
import { DEX_REGISTRY } from '../config/dex-registry';
import { MarketSummary } from '../features/home/MarketSummary';
import { InstallRibbon } from '../features/install/InstallCenter';
import { useLocale } from '../lib/locale';
import { useApp } from '../lib/store';
import { ProfileResult } from './RiskProfile';

const T = {
  title: { id: 'Tanya apa saja soal investasimu', en: 'Ask anything about your investments' },
  sub: { id: 'Jawaban dengan angka terverifikasi dari data, lengkap dengan grafik dan sumbernya. Bukan nasihat investasi.', en: 'Answers with verified numbers from the data, with charts and sources. Not investment advice.' },
  placeholder: { id: 'Misal: reksa dana pasar uang mana yang paling stabil?', en: 'E.g. which money-market funds have been the most stable?' },
  ask: { id: 'Tanya', en: 'Ask' },
  profileCta: { id: 'Kenali profil risikomu', en: 'Find your risk profile' },
  profileCtaSub: { id: '8 pertanyaan, 2 menit. Askfolio lalu menunjukkan kelas aset yang umumnya cocok untukmu.', en: '8 questions, 2 minutes. Askfolio then shows the asset classes that usually fit you.' },
  start: { id: 'Mulai', en: 'Start' },
  details: { id: 'Lihat detail & ulangi', en: 'Details & retake' },
  data: { id: 'Pelajari kelas aset', en: 'Study asset classes' },
  protect: { id: 'Lindungi dirimu', en: 'Protect yourself' },
  explore: { id: 'Jelajah semua data (29 topik)', en: 'Explore all data (29 topics)' },
} as const;

const SUGGEST = {
  id: ['Reksa dana pasar uang dengan return paling stabil', 'Saham Indonesia mana yang paling kuat tahun ini?', 'Kurs USD/IDR hari ini dibanding awal tahun', 'Berapa inflasi Indonesia terbaru?'],
  en: ['Money-market funds with the most stable returns', 'Which Indonesian stocks are strongest this year?', 'USD/IDR today vs the start of the year', 'What is Indonesia’s latest inflation?'],
} as const;
const SUGGEST_DEX = ['reksadex', 'idxdex', 'rupiahdex', 'inflationdex'] as const;
const CLASSES = ['reksadex', 'idxdex', 'rupiahdex', 'inflationdex', 'snp500dex', 'cryptdex'] as const;

export default function Home() {
  const L = useLocale();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const profile = useApp((s) => s.riskProfile);
  const ask = (text: string, dex = 'finandex-ai') => void nav(`/dex/${dex}/chat?q=${encodeURIComponent(text)}`);
  return (
    <div className="space-y-8">
      <section aria-labelledby="hero-title" className="mx-auto max-w-3xl pt-2 text-center">
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

      <Card className="mx-auto max-w-3xl p-5">
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
            <Link to="/profil-risiko" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-medium text-on-primary">
              {T.start[L]}
            </Link>
          </div>
        )}
      </Card>

      <section aria-labelledby="classes-title" className="space-y-3">
        <h2 id="classes-title" className="font-display text-xl">
          {T.data[L]}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CLASSES.map((id) => {
            const d = DEX_REGISTRY.find((x) => x.id === id)!;
            return (
              <Link key={id} to={`/dex/${id}`} className="pane flex items-center gap-3 p-3 hover:bg-pane-2">
                <DexIcon dex={d} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    <DexName dex={d} />
                  </span>
                  <span className="line-clamp-2 block text-xs text-ink-muted">{d.tagline[L]}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <MarketSummary />

      <section aria-labelledby="protect-title" className="space-y-3">
        <h2 id="protect-title" className="font-display text-xl">
          {T.protect[L]}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <EmergencyScamButton />
          {(['finlaiwyer', 'antiscamdex', 'mylaiwyer'] as const).map((id) => (
            <Link key={id} to={`/dex/${id}`} className="inline-flex min-h-12 items-center rounded-xl border border-edge bg-pane px-4 text-sm hover:bg-pane-2">
              <DexName dex={DEX_REGISTRY.find((x) => x.id === id)!} />
            </Link>
          ))}
        </div>
      </section>

      <InstallRibbon />
      <p className="text-center">
        <Link to="/data" className="inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline">
          {T.explore[L]} →
        </Link>
      </p>
    </div>
  );
}
