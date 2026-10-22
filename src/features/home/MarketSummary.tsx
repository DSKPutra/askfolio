// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Home market summary (§10.2.2): S&P 500, NASDAQ Composite, Gold, Bitcoin, WTI, EUR/USD — last value,
// 1D/YTD change, sparkline, as-of (from the global dataset; not real-time).
import { useTranslation } from 'react-i18next';
import { StatTile } from '../../components/StatTile';
import { ErrorState, Skeleton } from '../../components/ui';
import { useJson } from '../../lib/data';
import { useLocale } from '../../lib/locale';
import { formatDate, formatPercent, formatPrice } from '../../shared/format';
import { decimalsFor } from '../dex/GlobalMarkets';
import type { Spark } from '../dex/GlobalMarkets';

export const SUMMARY_SYMBOLS = ['^GSPC', '^IXIC', 'GC=F', 'BTC-USD', 'CL=F', 'EURUSD=X'] as const;

type Item = { symbol: string; slug: string; display_name: string; display_name_id: string; category: string; metrics: Record<string, number | string | null> };

export function MarketSummary() {
  const { t } = useTranslation();
  const locale = useLocale();
  const cat = useJson<{ as_of: string; items: Item[] }>('core/global/catalog.json');
  const spark = useJson<Spark>('core/global/spark.json');
  if (cat.isError) return <ErrorState onRetry={() => void cat.refetch()} />;
  return (
    <section aria-labelledby="mkt-summary">
      <h2 id="mkt-summary" className="mb-2 text-lg font-semibold">
        {t('home.marketSummary')}
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
        {SUMMARY_SYMBOLS.map((sym) => {
          const i = cat.data?.items.find((x) => x.symbol === sym);
          if (!i) return <Skeleton key={sym} className="h-28" />;
          const m = i.metrics;
          const r1 = typeof m.ret_1D === 'number' ? m.ret_1D : null;
          const ytd = typeof m.ret_YTD === 'number' ? m.ret_YTD : null;
          return (
            <StatTile
              key={sym}
              href={`/markets/${i.slug}`}
              label={locale === 'id' ? i.display_name_id : i.display_name}
              value={formatPrice(m.last_close as number, locale, decimalsFor(i.category, m.last_close as number))}
              changes={[
                { label: '1D', value: r1, text: formatPercent(r1, locale, 2, true) },
                { label: 'YTD', value: ytd, text: formatPercent(ytd, locale, 2, true) },
              ]}
              spark={spark.data?.assets[sym]?.c}
              footer={`${t('dex.asOf')} ${formatDate(m.last_date as string, locale)}`}
            />
          );
        })}
      </div>
    </section>
  );
}
