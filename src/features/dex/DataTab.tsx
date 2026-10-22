// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Data" tab (§9): exact source files (§3.1), coverage & as-of, cleaning rules, quality report,
// licence & attribution, built data files — from the registry, data notes, manifest, and data_quality.
import { useTranslation } from 'react-i18next';
import { AsOfBadge } from '../../components/badges';
import { Card } from '../../components/ui';
import { DATA_NOTES } from '../../config/data-notes';
import type { DexEntry } from '../../config/dex-registry';
import { INPUT_FILES } from '../../config/inputs';
import { useManifest } from '../../lib/data';
import { useLocale } from '../../lib/locale';
import { formatNumber } from '../../shared/format';
import { ToolPanel } from './ToolPanel';

export function DataTab({ dex }: { dex: DexEntry }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const m = useManifest();
  const entry = m.data?.dex[dex.id];
  const notes = DATA_NOTES[dex.id];
  const licence =
    dex.license === 'unknown'
      ? locale === 'id'
        ? 'Tidak dicantumkan dalam file — lisensi menurut penyedia dataset (dikonfirmasi sebelum distribusi publik).'
        : 'Not stated in the file — licence per the dataset provider (to be confirmed before public distribution).'
      : dex.license;
  const bytes = entry?.bytes ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-2 text-base font-semibold">{t('data.files')}</h2>
        <ul className="space-y-1 text-sm">
          {dex.inputs.map((n) => (
            <li key={n} className="break-all">
              <span className="text-muted">#{n}</span> <code>{INPUT_FILES[n]}</code>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <AsOfBadge asOf={entry?.as_of ?? dex.asOf} />
          <span className="text-xs text-muted">{t('data.realtime')}</span>
        </div>
      </Card>
      <Card>
        <h2 className="mb-2 text-base font-semibold">{t('data.attribution')}</h2>
        <p className="text-sm">{licence}</p>
        {dex.licenseNote && <p className="mt-1 text-sm text-muted">{dex.licenseNote[locale]}</p>}
        {dex.sample && <p className="mt-1 text-sm text-muted">{dex.sample[locale]}</p>}
        {notes.attribution && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {notes.attribution.map((a) => (
              <li key={a.en}>{a[locale]}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">{t('disclaimer.trademark')}</p>
      </Card>
      <Card>
        <h2 className="mb-2 text-base font-semibold">{t('data.rules')}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {notes.rules.map((r) => (
            <li key={r.en}>{r[locale]}</li>
          ))}
        </ul>
        {notes.limits.length > 0 && (
          <>
            <h3 className="mb-1 mt-3 text-sm font-semibold">{t('chat.flags')}</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {notes.limits.map((r) => (
                <li key={r.en}>{r[locale]}</li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 text-base font-semibold">{t('data.outputs')}</h2>
        {entry ? (
          <p className="text-sm text-muted">
            {formatNumber(entry.files, locale)} {locale === 'id' ? 'file' : 'files'} · {formatNumber(bytes / 1e6, locale, 1)} MB · build {m.data?.build_id}
          </p>
        ) : (
          <p className="text-sm text-muted">{t('common.empty')}</p>
        )}
      </Card>
      <div className="lg:col-span-2">
        <h2 className="mb-2 text-base font-semibold">{t('data.report')}</h2>
        <ToolPanel dex={dex.id} panel={{ tool: 'data_quality', input: { id: null } }} />
      </div>
    </div>
  );
}
