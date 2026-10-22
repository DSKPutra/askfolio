// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer "Kena Penipuan?": interactive help for financial-scam victims — pick a scenario to get
// immediate steps, official channels, and legal basis quoted from the financial-sector law texts.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui';
import { SCAM_CHANNELS, SCAM_INFO, SCAM_SCENARIOS } from '../../config/law-finance';
import type { ScamScenario } from '../../config/law-finance';
import { useLocale } from '../../lib/locale';
import { ToolPanel } from '../dex/ToolPanel';

const ICON: Record<ScamScenario, string> = { phishing_otp: '🔐', investasi_ilegal: '📈', pinjol_ilegal: '📱', salah_transfer: '↔', penipuan_online: '🛒', skimming_fraud: '💳', rekening_penampung: '🏦', kebocoran_data: '🗂' };

export function ScamHelp() {
  const { t } = useTranslation();
  const locale = useLocale();
  const nav = useNavigate();
  const [scenario, setScenario] = useState<ScamScenario | null>(null);
  const [story, setStory] = useState('');
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-warning/60 bg-surface p-4">
        <h2 className="text-lg font-semibold">{t('law.scamTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('law.scamIntro')}</p>
        <p role="note" className="mt-3 text-sm font-medium text-warning">
          {t('law.urgent')}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label={t('law.scamTitle')}>
        {SCAM_SCENARIOS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={scenario === s}
            onClick={() => setScenario(s)}
            className={`flex min-h-16 items-start gap-3 rounded-2xl border p-3 text-left text-sm transition ${scenario === s ? 'border-brand bg-surface-2' : 'border-border bg-surface hover:bg-surface-2'}`}
          >
            <span aria-hidden className="text-xl">
              {ICON[s]}
            </span>
            <span className="font-medium">{SCAM_INFO[s].label[locale]}</span>
          </button>
        ))}
      </div>
      {scenario ? (
        <ToolPanel key={scenario} dex="mylaiwyer" panel={{ tool: 'scam_guide', input: { scenario }, fixed: ['scenario'] }} />
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">{locale === 'id' ? 'Kanal pelaporan resmi' : 'Official reporting channels'}</h3>
          <ul className="space-y-2 text-sm">
            {SCAM_CHANNELS.map((c) => (
              <li key={c.id}>
                <strong>{c.name[locale]}</strong> — {c.how[locale]}
              </li>
            ))}
          </ul>
        </section>
      )}
      <form
        className="rounded-2xl border border-border bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (story.trim()) void nav(`/dex/mylaiwyer/chat?q=${encodeURIComponent(story.trim())}`);
        }}
      >
        <label htmlFor="scam-story" className="mb-2 block text-sm font-semibold">
          {t('law.scamAsk')}
        </label>
        <textarea id="scam-story" value={story} onChange={(e) => setStory(e.target.value)} rows={3} placeholder={t('law.scamPlaceholder')} className="w-full rounded-xl border border-border bg-surface-2 p-3 text-base sm:text-sm" />
        <p className="mt-1 text-xs text-muted">{t('chat.sensitive')}</p>
        <Button type="submit" variant="primary" className="mt-2" disabled={!story.trim()}>
          {t('law.ask')} →
        </Button>
      </form>
    </div>
  );
}
