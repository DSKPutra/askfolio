// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Beranda (§10.2): hero with "Tanya Finandex AI…", 4 cross-category suggestions, market summary,
// feature map of all Dex, as-of strip. Footer comes from the layout.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Button, Chip } from '../components/ui';
import { appTaglineFor } from '../config/brand';
import { WHITEPAPER_PDF } from '../content/whitepaper';
import { AsOfStrip, FeatureMap } from '../features/home/FeatureMap';
import { MarketSummary } from '../features/home/MarketSummary';
import { useLocale } from '../lib/locale';

/** Cross-category suggestions → the Dex that answers them. */
const HERO_TARGETS = ['finandex-ai', 'mylaiwyer', 'rupiahdex', 'salarydex'] as const;

export default function Home() {
  const { t } = useTranslation();
  const locale = useLocale();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const suggestions = t('home.suggest', { returnObjects: true }) as string[];
  const ask = (text: string, dex = 'finandex-ai') => void nav(`/dex/${dex}/chat?q=${encodeURIComponent(text)}`);
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <img src="/icons/finandex.svg" alt="" width={56} height={56} className="rounded-2xl" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide sm:text-3xl">Finandex</h1>
            <p className="text-sm text-muted">{appTaglineFor(locale)}</p>
          </div>
        </div>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) ask(q.trim());
          }}
        >
          <label htmlFor="hero-ask" className="sr-only">
            {t('home.askPlaceholder')}
          </label>
          <input id="hero-ask" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.askPlaceholder')} className="min-h-12 flex-1 rounded-2xl border border-border bg-surface-2 px-4 text-base" />
          <Button type="submit" variant="primary" className="min-h-12">
            {t('home.ask')}
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <Chip key={s} onClick={() => ask(s, HERO_TARGETS[i] ?? 'finandex-ai')}>
              {s}
            </Chip>
          ))}
        </div>
      </section>
      <section aria-labelledby="wp-home" className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="wp-home" className="text-lg font-semibold">
            {t('whitepaper.homeTitle')}
          </h2>
          <p className="text-sm text-muted">{t('whitepaper.homeBody')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={WHITEPAPER_PDF[locale]} download className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-medium text-[#0A0F0C] hover:brightness-110">
            ⬇ {t('whitepaper.download')}
          </a>
          <Link to="/whitepaper" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm hover:bg-surface-2">
            {t('whitepaper.read')} →
          </Link>
        </div>
      </section>
      <MarketSummary />
      <AsOfStrip />
      <FeatureMap />
    </div>
  );
}
