// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Menu/homepage categories (master prompt §10.2). Order is fixed.

export const DEX_GROUP_IDS = [
  'global-markets',
  'indonesia-markets',
  'crypto-macro',
  'startup-business',
  'living-work',
  'social-development',
  'sentiment-personal',
  'law',
] as const;

export type DexGroupId = (typeof DEX_GROUP_IDS)[number];

export type DexGroup = {
  id: DexGroupId;
  order: number;
  name: { id: string; en: string };
  description: { id: string; en: string };
};

export const DEX_GROUPS: readonly DexGroup[] = [
  {
    id: 'global-markets',
    order: 1,
    name: { id: 'Pasar Global & Saham', en: 'Global Markets & Equities' },
    description: {
      id: 'Analisis harga, return, risiko, dan peringkat aset/saham global serta IPO.',
      en: 'Price, return, risk, and ranking analysis of global assets, equities, and IPOs.',
    },
  },
  {
    id: 'indonesia-markets',
    order: 2,
    name: { id: 'Pasar & Ekonomi Indonesia', en: 'Indonesian Markets & Economy' },
    description: {
      id: 'IHSG, saham BEI, rupiah, makro BI, dan reksa dana.',
      en: 'IHSG, IDX equities, the rupiah, BI macro data, and mutual funds.',
    },
  },
  {
    id: 'crypto-macro',
    order: 3,
    name: { id: 'Kripto & Makro Global', en: 'Crypto & Global Macro' },
    description: {
      id: 'Aset kripto/DeFi, neraca bank sentral, dan inflasi dunia.',
      en: 'Crypto/DeFi assets, central bank balance sheets, and world inflation.',
    },
  },
  {
    id: 'startup-business',
    order: 4,
    name: { id: 'Startup, VC & Perusahaan', en: 'Startups, VC & Companies' },
    description: {
      id: 'Pendanaan, investor, jaringan co-investment, dan direktori perusahaan.',
      en: 'Funding, investors, co-investment networks, and company directories.',
    },
  },
  {
    id: 'living-work',
    order: 5,
    name: { id: 'Biaya Hidup, Kerja & Rumah Tangga', en: 'Cost of Living, Work & Household' },
    description: {
      id: 'Gaji, biaya hidup kota, harga rumah, dan harga makanan online.',
      en: 'Salaries, city living costs, house prices, and online food prices.',
    },
  },
  {
    id: 'social-development',
    order: 6,
    name: { id: 'Sosial & Pembangunan', en: 'Social & Development' },
    description: {
      id: 'Kemiskinan multidimensi dan liputan berita isu sosial.',
      en: 'Multidimensional poverty and news coverage of social issues.',
    },
  },
  {
    id: 'sentiment-personal',
    order: 7,
    name: { id: 'Sentimen & Keuangan Pribadi', en: 'Sentiment & Personal Finance' },
    description: {
      id: 'Sentimen & diskusi publik tentang fintech dan keuangan pribadi.',
      en: 'Public sentiment and discussion about fintech and personal finance.',
    },
  },
  {
    id: 'law',
    order: 8,
    name: { id: 'Hukum', en: 'Law' },
    description: {
      id: 'Informasi hukum berbasis dokumen resmi yang diunggah.',
      en: 'Legal information based on uploaded official documents.',
    },
  },
];
