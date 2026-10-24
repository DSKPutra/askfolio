// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Risk profile (owner request 2026-10-25): eight onboarding questions that separate risk APPETITE (willingness: goal,
// experience, reaction to a drop, acceptable yearly loss) from risk CAPACITY (ability: horizon, emergency fund, share of
// wealth invested, income stability). The profile is the lower of the two — someone who wants high returns but cannot
// afford a loss is not "aggressive". The result maps to asset CLASSES only (never products or issuers): this is
// education, not a personalised investment recommendation, which in Indonesia requires an OJK-licensed adviser.
// Answers stay on the device (zustand store); nothing is sent to the server.

type B = { id: string; en: string };
const b = (id: string, en: string): B => ({ id, en });

export type RiskLevel = 'konservatif' | 'moderat' | 'agresif';
export type Dimension = 'appetite' | 'capacity';
export type RiskQuestion = { id: string; dimension: Dimension; text: B; options: B[] };

/** Options are ordered from lowest to highest risk; the score of an answer is its index + 1 (1–4). */
export const RISK_QUESTIONS: RiskQuestion[] = [
  { id: 'goal', dimension: 'appetite', text: b('Apa tujuan utama Anda berinvestasi?', 'What is your main investing goal?'), options: [b('Menjaga nilai uang agar tidak berkurang', 'Keep my money from losing value'), b('Mendapat penghasilan rutin yang stabil', 'Earn a steady, regular income'), b('Pertumbuhan dengan risiko sedang', 'Growth with moderate risk'), b('Pertumbuhan setinggi mungkin', 'The highest possible growth')] },
  { id: 'horizon', dimension: 'capacity', text: b('Kapan Anda kemungkinan membutuhkan dana ini?', 'When might you need this money?'), options: [b('Kurang dari 1 tahun', 'Within 1 year'), b('1–3 tahun lagi', 'In 1–3 years'), b('3–5 tahun lagi', 'In 3–5 years'), b('Lebih dari 5 tahun lagi', 'In more than 5 years')] },
  { id: 'emergency', dimension: 'capacity', text: b('Berapa dana darurat yang sudah Anda miliki?', 'How big is your emergency fund?'), options: [b('Belum punya', 'I don’t have one'), b('Kurang dari 3 bulan pengeluaran', 'Less than 3 months of expenses'), b('3–6 bulan pengeluaran', '3–6 months of expenses'), b('Lebih dari 6 bulan pengeluaran', 'More than 6 months of expenses')] },
  { id: 'share', dimension: 'capacity', text: b('Berapa bagian dari total kekayaan Anda yang akan diinvestasikan?', 'What share of your total wealth will you invest?'), options: [b('Lebih dari 50%', 'More than 50%'), b('25–50%', '25–50%'), b('10–25%', '10–25%'), b('Kurang dari 10%', 'Less than 10%')] },
  { id: 'income', dimension: 'capacity', text: b('Bagaimana penghasilan Anda saat ini?', 'How is your income today?'), options: [b('Tidak tetap / sering berubah', 'Irregular or often changing'), b('Cukup, tapi pas-pasan', 'Enough, but tight'), b('Stabil', 'Stable'), b('Stabil dan terus bertambah', 'Stable and growing')] },
  { id: 'experience', dimension: 'appetite', text: b('Instrumen apa yang pernah Anda miliki?', 'Which investments have you owned?'), options: [b('Belum pernah berinvestasi', 'None yet'), b('Tabungan, deposito, atau reksa dana pasar uang', 'Savings, deposits, or money-market funds'), b('Obligasi atau reksa dana campuran', 'Bonds or balanced funds'), b('Saham, reksa dana saham, atau kripto', 'Stocks, equity funds, or crypto')] },
  { id: 'drop', dimension: 'appetite', text: b('Jika nilai investasi Anda turun 20% dalam sebulan, apa yang Anda lakukan?', 'If your investment fell 20% in a month, what would you do?'), options: [b('Menjual semuanya', 'Sell everything'), b('Menjual sebagian', 'Sell some'), b('Menahan dan menunggu', 'Hold and wait'), b('Membeli lagi selagi murah', 'Buy more while it’s cheap')] },
  { id: 'loss', dimension: 'appetite', text: b('Berapa penurunan nilai dalam setahun yang masih bisa Anda terima?', 'What yearly drop in value could you accept?'), options: [b('0–5%', '0–5%'), b('5–10%', '5–10%'), b('10–20%', '10–20%'), b('Lebih dari 20%', 'More than 20%')] },
];

const LEVELS: RiskLevel[] = ['konservatif', 'moderat', 'agresif'];
/** Average score 1–4 → level: ≤ 2.0 conservative, ≤ 3.0 moderate, above aggressive. */
const levelOf = (avg: number): RiskLevel => (avg <= 2 ? 'konservatif' : avg <= 3 ? 'moderat' : 'agresif');

export type RiskResult = { level: RiskLevel; appetite: RiskLevel; capacity: RiskLevel; scores: { appetite: number; capacity: number } };

/** `answers[i]` = chosen option index for RISK_QUESTIONS[i]. */
export function scoreRisk(answers: number[]): RiskResult {
  if (answers.length !== RISK_QUESTIONS.length || answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= RISK_QUESTIONS[i]!.options.length)) throw new Error('every question needs exactly one answer');
  const avg = (d: Dimension) => {
    const xs = RISK_QUESTIONS.map((q, i) => (q.dimension === d ? answers[i]! + 1 : null)).filter((x): x is number => x !== null);
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  const scores = { appetite: avg('appetite'), capacity: avg('capacity') };
  const appetite = levelOf(scores.appetite);
  const capacity = levelOf(scores.capacity);
  const level = LEVELS[Math.min(LEVELS.indexOf(appetite), LEVELS.indexOf(capacity))]!;
  return { level, appetite, capacity, scores };
}

export type AssetClass = { name: B; why: B; dex: string | null };
export type ProfileInfo = { label: B; summary: B; suitable: AssetClass[]; limit: AssetClass[] };

/** Asset-class matching per level (education). `dex` links to the data that lets the user study that class. */
export const RISK_PROFILES: Record<RiskLevel, ProfileInfo> = {
  konservatif: {
    label: b('Konservatif', 'Conservative'),
    summary: b('Mengutamakan keamanan modal dan dana yang mudah dicairkan; menerima imbal hasil lebih rendah.', 'Puts capital safety and easy access first; accepts lower returns.'),
    suitable: [
      { name: b('Dana darurat & tabungan/deposito', 'Emergency fund & savings/deposits'), why: b('Nilai stabil dan mudah dicairkan.', 'Stable value, easy to withdraw.'), dex: null },
      { name: b('Reksa dana pasar uang', 'Money-market funds'), why: b('Fluktuasi kecil; cocok untuk tujuan kurang dari 1 tahun.', 'Small swings; suits goals under a year.'), dex: 'reksadex' },
      { name: b('Surat utang negara ritel', 'Retail government bonds'), why: b('Pembayaran bunga terjadwal; risiko gagal bayar rendah.', 'Scheduled coupons; low default risk.'), dex: null },
    ],
    limit: [{ name: b('Saham, reksa dana saham, kripto', 'Stocks, equity funds, crypto'), why: b('Bisa turun tajam dalam waktu singkat.', 'Can fall sharply in a short time.'), dex: null }],
  },
  moderat: {
    label: b('Moderat', 'Moderate'),
    summary: b('Mencari pertumbuhan dengan naik-turun yang masih nyaman; menyeimbangkan aset stabil dan aset bertumbuh.', 'Seeks growth with swings you can live with; balances stable and growth assets.'),
    suitable: [
      { name: b('Reksa dana pendapatan tetap & obligasi', 'Fixed-income funds & bonds'), why: b('Penghasilan rutin dengan risiko menengah-rendah.', 'Regular income with low-to-medium risk.'), dex: 'reksadex' },
      { name: b('Reksa dana campuran', 'Balanced funds'), why: b('Gabungan saham dan obligasi dalam satu produk.', 'Stocks and bonds in one fund.'), dex: 'reksadex' },
      { name: b('Saham berkapitalisasi besar (porsi terbatas)', 'Large-cap stocks (limited share)'), why: b('Pertumbuhan jangka panjang; pelajari dulu riwayat naik-turunnya.', 'Long-term growth; study their past swings first.'), dex: 'idxdex' },
    ],
    limit: [{ name: b('Kripto dan saham spekulatif', 'Crypto and speculative stocks'), why: b('Volatilitas sangat tinggi; jika ada, hanya porsi kecil.', 'Very volatile; at most a small share.'), dex: 'cryptdex' }],
  },
  agresif: {
    label: b('Agresif', 'Aggressive'),
    summary: b('Siap menghadapi penurunan besar demi potensi pertumbuhan jangka panjang yang lebih tinggi.', 'Ready to ride large drops for higher long-term growth potential.'),
    suitable: [
      { name: b('Saham Indonesia', 'Indonesian stocks'), why: b('Potensi pertumbuhan tinggi untuk jangka lebih dari 5 tahun.', 'High growth potential over 5+ years.'), dex: 'idxdex' },
      { name: b('Reksa dana saham', 'Equity funds'), why: b('Saham yang dikelola manajer investasi dan terdiversifikasi.', 'Diversified stocks run by a fund manager.'), dex: 'reksadex' },
      { name: b('Saham global', 'Global stocks'), why: b('Diversifikasi di luar Indonesia (ada risiko kurs).', 'Diversification beyond Indonesia (currency risk).'), dex: 'snp500dex' },
    ],
    limit: [{ name: b('Kripto', 'Crypto'), why: b('Bahkan untuk profil agresif, sebaiknya porsi kecil karena bisa turun lebih dari 70%.', 'Even for aggressive profiles, keep it small — it can fall more than 70%.'), dex: 'cryptdex' }],
  },
};

export const RISK_DISCLAIMER = b(
  'Hasil ini adalah edukasi umum tentang kelas aset yang biasanya sesuai dengan profil Anda, bukan rekomendasi produk atau nasihat investasi pribadi. Untuk rekomendasi pribadi, hubungi penasihat investasi berizin OJK. Jawaban Anda hanya tersimpan di perangkat ini.',
  'This is general education about the asset classes that usually suit your profile — not a product recommendation or personal investment advice. For personal advice, consult an OJK-licensed investment adviser. Your answers are stored only on this device.',
);
