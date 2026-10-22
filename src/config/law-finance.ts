// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Financial-sector law corpus for My LAIwyer: 19 official texts (UU, POJK, PBI) on banking, OJK/BI,
// consumer protection, fund transfers, money laundering, electronic transactions, personal data, and
// fraud in the new Criminal Code. Sources: peraturan.go.id, ojk.go.id, JDIH BPK (law-finance-sources.json).
import raw from './law-finance-sources.json';

export type FinanceLawDoc = {
  doc_id: string;
  kind: 'UU' | 'POJK' | 'PBI';
  number: string;
  year: number;
  title: string;
  short: { id: string; en: string };
  url: string;
  file: string;
  topics: string[];
  bytes: number;
  sha256: string;
  pages: number;
  max_pasal: number;
};

export const FINANCE_LAW_DOCS = (raw as { docs: FinanceLawDoc[] }).docs;
export const FINANCE_LAW_NOTE = (raw as { note: string }).note;
export const FINANCE_DOC_IDS = FINANCE_LAW_DOCS.map((d) => d.doc_id);

/** Official reporting channels (verified on ojk.go.id / iasc.ojk.go.id / bi.go.id, October 2026). */
export const SCAM_CHANNELS = [
  { id: 'bank', name: { id: 'Bank / penyedia e-wallet Anda', en: 'Your bank / e-wallet provider' }, how: { id: 'Hubungi call center resmi (nomor di kartu atau aplikasi resmi) secepatnya: minta pemblokiran akun/kartu dan laporkan rekening tujuan.', en: 'Call the official call centre (number on your card or official app) immediately: ask to block your account/card and report the recipient account.' } },
  { id: 'iasc', name: { id: 'Indonesia Anti-Scam Centre (IASC) — OJK', en: 'Indonesia Anti-Scam Centre (IASC) — OJK' }, how: { id: 'Lapor di iasc.ojk.go.id untuk jalur penanganan finansial (upaya pemblokiran rekening pelaku). Pelaporan tidak menjamin dana kembali.', en: 'Report at iasc.ojk.go.id for the financial handling track (attempt to block the scammer’s account). Reporting does not guarantee funds are returned.' }, url: 'https://iasc.ojk.go.id' },
  { id: 'police', name: { id: 'Kepolisian', en: 'Police' }, how: { id: 'Buat Laporan Polisi (LP) di kantor polisi terdekat untuk jalur proses hukum pidana; bawa bukti.', en: 'File a police report at the nearest police station for the criminal process; bring evidence.' } },
  { id: 'ojk157', name: { id: 'Kontak OJK 157', en: 'OJK Contact 157' }, how: { id: 'Telepon 157, WhatsApp 081157157157, email konsumen@ojk.go.id — tanya legalitas, pengaduan terhadap lembaga jasa keuangan.', en: 'Phone 157, WhatsApp +62 81157157157, email konsumen@ojk.go.id — check legality, complain about a financial institution.' } },
  { id: 'sipasti', name: { id: 'Satgas PASTI', en: 'PASTI Task Force' }, how: { id: 'Laporkan penawaran investasi/pinjaman online ilegal di sipasti.ojk.go.id.', en: 'Report illegal investment / online-loan offers at sipasti.ojk.go.id.' }, url: 'https://sipasti.ojk.go.id' },
  { id: 'bi131', name: { id: 'Bank Indonesia — BI Bicara 131', en: 'Bank Indonesia — BI Bicara 131' }, how: { id: 'Pengaduan terkait sistem pembayaran yang diawasi BI: (62 21) 131.', en: 'Complaints about payment systems overseen by BI: +62 21 131.' } },
  { id: 'emergency', name: { id: 'Darurat 112', en: 'Emergency 112' }, how: { id: 'Bila ada ancaman terhadap keselamatan.', en: 'If your safety is threatened.' } },
] as const;

export const SCAM_SCENARIOS = ['phishing_otp', 'investasi_ilegal', 'pinjol_ilegal', 'salah_transfer', 'penipuan_online', 'skimming_fraud', 'rekening_penampung', 'kebocoran_data'] as const;
export type ScamScenario = (typeof SCAM_SCENARIOS)[number];

export const SCAM_INFO: Record<ScamScenario, { label: { id: string; en: string }; signs: { id: string; en: string }[]; steps: { id: string; en: string }[]; queries: string[]; channels: string[] }> = {
  phishing_otp: {
    label: { id: 'Phishing / OTP / akun dibobol', en: 'Phishing / OTP / account takeover' },
    signs: [{ id: 'Diminta kode OTP, PIN, atau password lewat telepon/chat yang mengaku bank.', en: 'Asked for an OTP, PIN, or password by phone/chat claiming to be the bank.' }, { id: 'Tautan atau file APK yang mengatasnamakan bank, kurir, atau undangan.', en: 'Links or APK files impersonating a bank, courier, or invitation.' }],
    steps: [{ id: 'Segera hubungi bank untuk blokir akun/kartu dan ganti PIN/password.', en: 'Call your bank immediately to block the account/card and change PIN/password.' }, { id: 'Hapus aplikasi/APK mencurigakan; aktifkan verifikasi dua langkah.', en: 'Remove suspicious apps/APKs; enable two-factor authentication.' }, { id: 'Lapor ke IASC dan buat laporan polisi bila ada dana keluar.', en: 'Report to IASC and file a police report if money was taken.' }],
    queries: ['ganti rugi kerugian konsumen kesalahan kelalaian', 'kerahasiaan data pribadi konsumen', 'akses ilegal sistem elektronik'],
    channels: ['bank', 'iasc', 'police', 'ojk157'],
  },
  investasi_ilegal: {
    label: { id: 'Investasi bodong / skema ponzi', en: 'Fraudulent investment / Ponzi scheme' },
    signs: [{ id: 'Imbal hasil tinggi dan pasti, tanpa risiko; bonus merekrut anggota.', en: 'High, guaranteed returns with no risk; bonuses for recruiting members.' }, { id: 'Tidak terdaftar/berizin OJK.', en: 'Not registered/licensed by OJK.' }],
    steps: [{ id: 'Hentikan penyetoran; cek legalitas ke Kontak OJK 157.', en: 'Stop depositing; check legality via OJK Contact 157.' }, { id: 'Laporkan entitas ke sipasti.ojk.go.id; lapor ke IASC dan polisi bila sudah rugi.', en: 'Report the entity at sipasti.ojk.go.id; report to IASC and the police if you lost money.' }],
    queries: ['menghimpun dana masyarakat simpanan tanpa izin usaha pidana penjara', 'dilarang dengan sengaja menipu atau mengelabui pihak lain', 'penipuan tipu muslihat rangkaian kebohongan'],
    channels: ['ojk157', 'sipasti', 'iasc', 'police'],
  },
  pinjol_ilegal: {
    label: { id: 'Pinjaman online ilegal / penagihan kasar', en: 'Illegal online loans / abusive debt collection' },
    signs: [{ id: 'Tidak berizin OJK; meminta akses kontak/galeri; bunga dan denda tidak wajar.', en: 'Not OJK-licensed; requests access to contacts/gallery; unreasonable interest and penalties.' }, { id: 'Penagihan dengan ancaman, intimidasi, atau menyebarkan data.', en: 'Collection with threats, intimidation, or spreading personal data.' }],
    steps: [{ id: 'Cek apakah penyelenggara berizin (Kontak OJK 157).', en: 'Check whether the lender is licensed (OJK Contact 157).' }, { id: 'Simpan bukti ancaman; laporkan ke sipasti.ojk.go.id dan polisi.', en: 'Keep evidence of threats; report to sipasti.ojk.go.id and the police.' }],
    queries: ['penagihan kredit pembiayaan ancaman kekerasan mempermalukan', 'menjaga kerahasiaan data pribadi pengguna', 'pengiriman informasi elektronik ancaman kekerasan menakut-nakuti'],
    channels: ['ojk157', 'sipasti', 'police'],
  },
  salah_transfer: {
    label: { id: 'Salah transfer / dana masuk yang bukan hak', en: 'Mistaken transfer / funds that are not yours' },
    signs: [{ id: 'Dana terkirim ke rekening yang keliru, atau ada dana asing masuk lalu diminta dikembalikan ke rekening lain.', en: 'Money sent to the wrong account, or unknown funds arrive and you are asked to return them to another account.' }],
    steps: [{ id: 'Segera hubungi bank pengirim untuk proses pengembalian.', en: 'Contact the sending bank right away for a return process.' }, { id: 'Jika menerima dana asing, jangan mengirimnya sendiri ke rekening lain — laporkan ke bank Anda.', en: 'If you receive unknown funds, do not forward them yourself — report to your bank.' }],
    queries: ['menguasai dan mengakui sebagai miliknya dana hasil transfer bukan haknya', 'kesalahan transfer dana pengembalian'],
    channels: ['bank', 'iasc', 'police'],
  },
  penipuan_online: {
    label: { id: 'Ditipu lalu transfer / jual beli online / social engineering', en: 'Tricked into transferring / online shopping fraud / social engineering' },
    signs: [{ id: 'Harga terlalu murah, desakan transfer cepat, rekening atas nama pribadi.', en: 'Prices too good to be true, pressure to transfer quickly, personal-name accounts.' }],
    steps: [{ id: 'Hentikan komunikasi dan jangan mengirim uang lagi.', en: 'Stop communicating and do not send more money.' }, { id: 'Segera hubungi bank Anda: laporkan rekening tujuan dan minta upaya pemblokiran.', en: 'Call your bank at once: report the recipient account and ask for it to be blocked.' }, { id: 'Lapor ke IASC (iasc.ojk.go.id) dan buat laporan polisi.', en: 'Report to IASC (iasc.ojk.go.id) and file a police report.' }, { id: 'Simpan bukti: chat, iklan, nomor rekening & telepon pelaku, bukti transfer.', en: 'Keep evidence: chats, ads, the scammer’s account & phone number, transfer receipts.' }],
    queries: ['penipuan tipu muslihat rangkaian kebohongan menyerahkan barang', 'berita bohong menyesatkan kerugian konsumen transaksi elektronik'],
    channels: ['bank', 'iasc', 'police'],
  },
  skimming_fraud: {
    label: { id: 'Skimming kartu / transaksi tidak dikenal', en: 'Card skimming / unrecognised transactions' },
    signs: [{ id: 'Mutasi atau tagihan yang tidak pernah Anda lakukan.', en: 'Debits or charges you never made.' }],
    steps: [{ id: 'Blokir kartu, sanggah transaksi secara tertulis ke bank, minta nomor pengaduan.', en: 'Block the card, dispute the transactions in writing with the bank, get a complaint number.' }, { id: 'Bila tidak diselesaikan, adukan ke OJK (157) atau BI (131) sesuai lingkupnya.', en: 'If unresolved, escalate to OJK (157) or BI (131) depending on scope.' }],
    queries: ['wajib bertanggung jawab atas kerugian konsumen kesalahan kelalaian', 'penanganan pengaduan konsumen', 'kecurangan fraud penyimpangan lembaga jasa keuangan'],
    channels: ['bank', 'ojk157', 'bi131'],
  },
  rekening_penampung: {
    label: { id: 'Diminta meminjamkan/menjual rekening (money mule)', en: 'Asked to lend/sell your account (money mule)' },
    signs: [{ id: 'Tawaran imbalan untuk membuka atau meminjamkan rekening/e-wallet.', en: 'Offers of payment to open or lend a bank/e-wallet account.' }],
    steps: [{ id: 'Tolak; rekening Anda dapat dipakai menampung hasil kejahatan.', en: 'Refuse; your account may be used to hold proceeds of crime.' }, { id: 'Bila sudah terlanjur, hubungi bank untuk menutup/memblokir dan laporkan.', en: 'If it already happened, ask the bank to close/block it and report.' }],
    queries: ['menempatkan mentransfer harta kekayaan hasil tindak pidana', 'menerima atau menguasai penempatan pentransferan'],
    channels: ['bank', 'police', 'ojk157'],
  },
  kebocoran_data: {
    label: { id: 'Data pribadi bocor / disalahgunakan', en: 'Personal data leaked / misused' },
    signs: [{ id: 'Data Anda dipakai untuk pinjaman, akun, atau transaksi tanpa izin.', en: 'Your data is used for loans, accounts, or transactions without consent.' }],
    steps: [{ id: 'Minta penjelasan pengendali data dan hapus/perbaiki data; ganti kredensial.', en: 'Ask the data controller for an explanation and erasure/correction; change credentials.' }, { id: 'Laporkan penyalahgunaan ke penyedia layanan dan polisi.', en: 'Report misuse to the service provider and the police.' }],
    queries: ['kegagalan pelindungan data pribadi pemberitahuan', 'hak subjek data pribadi', 'larangan menggunakan data pribadi yang bukan miliknya'],
    channels: ['bank', 'ojk157', 'police'],
  },
};
