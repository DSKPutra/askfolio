// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Curated event catalogue with exact dates only (§8.5). Used to window price data; never as data itself.
export type MarketEvent = { id: string; date: string; label: { id: string; en: string } };

export const EVENTS: MarketEvent[] = [
  { id: 'nasdaq-peak-2000', date: '2000-03-10', label: { id: 'Puncak NASDAQ (gelembung dot-com)', en: 'NASDAQ peak (dot-com bubble)' } },
  { id: 'lehman-2008', date: '2008-09-15', label: { id: 'Kebangkrutan Lehman Brothers', en: 'Lehman Brothers bankruptcy' } },
  { id: 'snb-floor-2015', date: '2015-01-15', label: { id: 'SNB melepas patokan franc Swiss', en: 'SNB removes the Swiss franc floor' } },
  { id: 'yuan-devaluation-2015', date: '2015-08-11', label: { id: 'Devaluasi yuan', en: 'Yuan devaluation' } },
  { id: 'brexit-2016', date: '2016-06-24', label: { id: 'Hasil referendum Brexit', en: 'Brexit referendum result' } },
  { id: 'who-pandemic-2020', date: '2020-03-11', label: { id: 'WHO menyatakan pandemi COVID-19', en: 'WHO declares COVID-19 a pandemic' } },
  { id: 'wti-negative-2020', date: '2020-04-20', label: { id: 'Harga WTI negatif', en: 'WTI price turns negative' } },
  { id: 'russia-ukraine-2022', date: '2022-02-24', label: { id: 'Invasi Rusia ke Ukraina', en: 'Russian invasion of Ukraine' } },
  { id: 'svb-2023', date: '2023-03-10', label: { id: 'Runtuhnya Silicon Valley Bank', en: 'Silicon Valley Bank collapse' } },
  { id: 'btc-halving-2016', date: '2016-07-09', label: { id: 'Halving Bitcoin 2016', en: 'Bitcoin halving 2016' } },
  { id: 'btc-halving-2020', date: '2020-05-11', label: { id: 'Halving Bitcoin 2020', en: 'Bitcoin halving 2020' } },
  { id: 'btc-halving-2024', date: '2024-04-20', label: { id: 'Halving Bitcoin 2024', en: 'Bitcoin halving 2024' } },
  { id: 'eth-merge-2022', date: '2022-09-15', label: { id: 'Ethereum Merge', en: 'Ethereum Merge' } },
];

export const RUPIAH_EVENTS: MarketEvent[] = [
  { id: 'taper-tantrum-2013', date: '2013-05-22', label: { id: 'Testimoni Bernanke (taper tantrum)', en: 'Bernanke testimony (taper tantrum)' } },
  { id: 'yuan-devaluation-2015', date: '2015-08-11', label: { id: 'Devaluasi yuan', en: 'Yuan devaluation' } },
  { id: 'who-pandemic-2020', date: '2020-03-11', label: { id: 'WHO menyatakan pandemi COVID-19', en: 'WHO declares COVID-19 a pandemic' } },
  { id: 'lehman-2008', date: '2008-09-15', label: { id: 'Kebangkrutan Lehman Brothers', en: 'Lehman Brothers bankruptcy' } },
];
