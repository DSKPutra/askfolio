// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Dex Hub (/dex): same grouping and components as the home feature map, without hero/market summary.
import { useTranslation } from 'react-i18next';
import { AsOfStrip, FeatureMap } from '../features/home/FeatureMap';

export default function DexHub() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t('dex.hub')}</h1>
      <AsOfStrip />
      <FeatureMap />
    </div>
  );
}
