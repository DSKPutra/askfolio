<!-- © 2026 Dea Saka Kurnia Putra. All rights reserved. -->
# Benchmark UI — Spektrum vs aplikasi keuangan lain

Permintaan pemilik (2026-10-24): *"rombak seluruh UI/UX nya dengan warna yang enak dilihat, jangan monoton, coba compare dengan yang lain"*.

## 1. Pembanding

Data warna diambil dari situs publik masing-masing pada Oktober 2026 (CSS/halaman beranda). Hanya pola visual yang dibandingkan; tidak ada aset atau merek pihak lain yang dipakai.

| Aplikasi | Kanvas | Warna utama | Warna aksen / status | Bentuk | Catatan |
|---|---|---|---|---|---|
| Bibit | putih | hijau `#00BF71` | coral `#FF6666` | radius 4–6 px | satu warna merek, aksen hangat untuk turun/peringatan |
| Stockbit | putih | hijau `#00AB6B` | merah `#FF4D4F` | kartu datar | warna dipakai terutama untuk naik/turun harga |
| TradingView | hitam/putih netral | biru pucat `#E1E7F5` | warna seri grafik beragam | tombol pil | kanvas netral, warna diserahkan ke data |
| Revolut | hitam/putih | — | ilustrasi berwarna per produk | radius 20 px, pil | tiap produk punya warna sendiri |
| **Finandex sebelum** ("Obligasi") | kertas hijau `#EEF2EC` | hijau `#1D6A44` | teal `#256C7C`, coklat `#8A5A0E` | kartu datar | hampir semua permukaan hijau → monoton |

Pola yang sama di aplikasi yang paling enak dilihat: **kanvas netral**, **satu warna utama untuk aksi**, **warna kedua yang hangat untuk sorotan**, dan **warna kategori/produk** agar pengguna bisa membedakan bagian aplikasi tanpa membaca.

## 2a. Revisi 2026-10-25 — Spektrum v2 (tanpa hijau)
Umpan balik pemilik: tampilan masih terasa hijau dan melelahkan mata. Penyebab: (1) service worker menyajikan versi lama dari cache sampai pengguna mengklik "Reload"; (2) primary teal dan ikon neon `#19F23A` tetap terbaca hijau. Perubahan: primary indigo, aksen amber, AI violet, data biru, mode gelap biru-malam lembut, ikon & logo berwarna kategori tanpa glow, update otomatis. Nilai di tabel bawah digantikan oleh `src/config/brand.ts` (sumber kebenaran).

## 2. Keputusan "Spektrum" (versi pertama, 2026-10-24)

| Peran | Terang | Gelap | Dipakai untuk |
|---|---|---|---|
| Kanvas | `#F6F7F9` (abu dingin netral) | `#0F1520` (biru malam) | latar halaman |
| Primer | teal `#0F766E` | `#2DD4BF` | tombol, tautan, chip aktif |
| Aksen | oranye `#C2410C` | `#FB923C` | sorotan, CTA sekunder |
| AI | indigo `#4F46E5` | `#A5B4FC` | jawaban/agen AI |
| 8 kategori | biru, oranye, ungu, sian, emas, magenta, hijau zaitun, merah anggur | versi pastel | garis atas kartu, ikon, titik chip, judul bagian, ruangan Agent Room, konstelasi |

- Setiap kategori Dex (urutan `DEX_GROUP_IDS`) punya warna sendiri lewat variabel CSS `--group-1..8`; komponen memakai utilitas `.g-tint`, `.g-text`, `.g-stripe`, `.g-rule`, `.g-dot` dengan variabel `--g`.
- Latar berwarna dibuat dengan `color-mix` 8 % di atas `--pane`; teks kategori tetap ≥ 4,5 : 1 (pada 10 % oranye turun ke 4,48, karena itu dipakai 8 %).
- Semua token teks dan 8 warna kategori diuji kontras AA (≥ 4,5 : 1) terhadap `field-1`, `pane`, `pane-2` di kedua tema — `tests/unit/contrast.test.ts`.
- Mode buta warna mengganti pasangan merah/hijau dengan biru/oranye seperti sebelumnya.
- Tidak ada gradien dekoratif atau glow (gate `npm run ui:audit`).

## 3. Sebelum / sesudah

Tangkapan di [`spektrum/`](spektrum/) — `*-before.png` = produksi bertema Obligasi & Brankas, `*-after.png` = Spektrum; halaman Beranda, FinLAIwyer, RupiahDex, Agent Room; desktop 1440 × 900 dan ponsel 390 × 844; terang & gelap. Dibangkitkan dengan:

```bash
npx tsx scripts/ui/recolor-shots.ts --out=docs/ui-review/spektrum
```
