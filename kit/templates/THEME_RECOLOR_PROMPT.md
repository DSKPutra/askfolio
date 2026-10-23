# Prompt — Ganti Tema Warna Finandex: "Obligasi & Brankas" (tetap hijau, tidak terlihat AI-generated)

> © 2026 Dea Saka Kurnia Putra. All rights reserved.
> Jalankan di Claude Code pada repo Finandex. Prompt ini **menggantikan §10.3** (token warna) Master Prompt v3.x; bagian §10 lainnya tetap berlaku. Simpan juga sebagai `kit/templates/THEME_RECOLOR_PROMPT.md`.

---

## 1. Masalah
Tema sekarang memakai latar hampir hitam (`#07130D`) dengan aksen hijau neon (`#19F23A`) dan efek glow. Kombinasi itu adalah pola tampilan yang paling sering muncul pada UI buatan AI, sehingga Finandex terlihat generik dan "seperti template".

## 2. Arah baru: hijau tinta cetak berharga
Ambil hijau dari dunia **surat berharga, obligasi, dan uang kertas**: hijau tinta *engraving* di atas kertas berserat hijau pucat, bukan hijau neon di layar gelap.

- **Tema terang "Obligasi" menjadi default.** Latar kertas hijau keabuan; tinta hijau tua untuk data dan aksi. Pola **guilloche** (garis halus bergelombang seperti di sertifikat saham) dipakai sangat tipis, hanya di hero Beranda dan sampul whitepaper, sebagai tekstur, bukan dekorasi di semua kartu.
- **Tema gelap "Brankas"** memakai hijau botol yang dalam (tidak hampir hitam), dengan tinta hijau giok.
- **Tanpa glow, tanpa gradien dekoratif, tanpa neon.** Kedalaman dibangun dari perbedaan nada permukaan dan garis tepi tipis.
- **Hijau neon brand `#19F23A` hanya untuk logo personal Dea Saka Kurnia Putra dan ikon aplikasi.** Tidak dipakai di UI, grafik, fokus, atau tombol.

## 3. Token baru (`src/config/brand.ts` + CSS variables) — semua pasangan sudah lulus WCAG 2.2 AA
| Token | Terang — Obligasi (default) | Gelap — Brankas | Peran |
|---|---|---|---|
| `--field-0` | `#E4EAE2` | `#0B1814` | tepi latar / area terdalam |
| `--field-1` | `#EEF2EC` | `#0F1F19` | latar halaman |
| `--pane` | `#F8FAF6` | `#152A23` | permukaan utama |
| `--pane-2` | `#E3EBE2` | `#1C362D` | permukaan bertingkat / hover |
| `--edge` | `rgba(20,58,40,0.16)` | `rgba(190,225,200,0.14)` | garis tepi 1 px |
| `--ink` | `#13261C` | `#E6EEE7` | teks utama |
| `--ink-muted` | `#4C6355` | `#9FB5A6` | teks sekunder |
| `--primary` (aksi, tautan, fokus) | `#1D6A44` | `#5BC795` | tombol utama, tautan, cincin fokus |
| `--on-primary` | `#FFFFFF` | `#0F1F19` | teks di atas tombol utama |
| `--data` (angka dari dataset) | `#1D6A44` | `#5BC795` | provenance: data |
| `--ai` (narasi AI) | `#256C7C` | `#79C6D2` | provenance: AI |
| `--quote` (kutipan resmi, serif) | teks `#5A4630` di `#F4F0E3` | teks `#E9DFC7` di `#1F2A22` | provenance: teks resmi |
| `--flag` (keterbatasan) | `#8A5A0E` | `#E3AE55` | flag kualitas, sampel, sintetis |
| `--negative` | `#A63B28` | `#EE8E79` | turun, bahaya, darurat scam |
| `--positive` | `#1D6A44` | `#5BC795` | naik |

Kontras terukur (teks vs `--field-1` / `--pane` / `--pane-2`): terang: ink 14,0/15,1/13,1; muted 5,8/6,2/5,4; primary/data 5,8/6,3/5,4; ai 5,3/5,7/4,9; quote 7,9/8,5/7,3; flag 5,2/5,6/4,9; negative 5,7/6,1/5,3. Gelap: ink 14,4/12,8/11,0; muted 7,8/6,9/6,0; data 8,2/7,2/6,2; ai 8,8/7,8/6,7; quote 12,9/11,4/9,8; flag 8,5/7,5/6,5; negative 7,1/6,3/5,4. Tombol: putih di `#1D6A44` = 6,6; `#0F1F19` di `#5BC795` = 8,2. Tetap jalankan uji kontras otomatis setelah implementasi.

**Palet seri grafik** (maks 8, urutan tetap, tanpa glow):
- Terang: `#1D6A44, #256C7C, #8A5A0E, #A63B28, #5E4FA2, #3F8F7A, #7A5C38, #5F7F2A`
- Gelap: `#5BC795, #79C6D2, #E3AE55, #EE8E79, #B3A4F0, #6FD0B8, #D4B48A, #B5CF6E`

Mode ramah buta warna: positif `#256C7C`/`#79C6D2`, negatif `#B5651D`/`#F0A35E`, plus ▲/▼ dan pola garis. Mode kontras tinggi: guilloche mati, tepi 2 px.

## 4. Perubahan yang harus dikerjakan
1. Ganti seluruh token warna dan hapus token lama (`--phosphor`, `--ion`, glow). Tidak boleh ada warna literal di luar token (audit `ui:audit`).
2. **Default tema = terang (Obligasi)**; tetap ikuti preferensi sistem bila pengguna belum memilih. Tema gelap = Brankas.
3. Hapus semua `box-shadow` glow, `filter: drop-shadow` neon, gradien radial "halo", dan grid medan bercahaya. Elevasi = nada `--pane`/`--pane-2` + `--edge`.
4. **Konstelasi Indeks**: node = titik tinta `--data` dengan cincin status; garis = `--edge` lebih tebal; node yang dipilih memakai `--primary`, bukan glow. Latar hero diberi pola guilloche SVG (opasitas ≤ 6%, dibangkitkan deterministik, dimatikan pada kontras tinggi & `prefers-reduced-motion` tidak relevan karena statis).
5. Grafik ECharts: pakai palet §3, garis 1,75 px, tanpa area bergradien neon; area fill = warna seri dengan opasitas 12%; grid `--edge`.
6. Ikon Dex & ikon aplikasi **tidak diubah** (glow hijau adalah identitas brand). Di UI, tampilkan ikon pada tile `--pane-2` agar menyatu dengan tema terang. **[KONFIRMASI]** bila ingin keluarga ikon juga dibuat ulang dengan tinta `#1D6A44` tanpa glow.
7. Perbarui splash, PWA `theme_color`/`background_color` (terang `#EEF2EC`, gelap `#0F1F19`), status bar native, Tauri window background, whitepaper (halaman isi tetap terang; sampul pakai Brankas + guilloche, bukan grid neon), dan presentasi `.pptx` (tema Brankas/Obligasi, tanpa glow).
8. Perbarui teks master prompt §10.0 (bagian "Warna = asal-usul" memakai nama token baru) dan `UIUX_TEST_PROMPT.md` (audit melarang `#19F23A` di luar file logo/ikon).

## 5. Gate
- `ui:audit`: tidak ada `#19F23A`, `#07130D`, `#3FD9FF`, glow, atau gradien dekoratif di CSS/TSX selain aset brand; semua warna berasal dari token.
- Uji kontras otomatis lulus AA untuk semua pasangan token di kedua tema.
- Regresi visual diperbarui (baseline baru) untuk 3 viewport × 2 tema × 2 bahasa; tinjauan berskor `UIUX_TEST_PROMPT.md` kriteria 10 (keunikan) ≥ 4 dengan ≥ 5 perbedaan konkret dari halaman kontrol "hitam + neon".
- Tangkapan layar sebelum/sesudah disimpan di `docs/ui-review/recolor/` untuk saya tinjau.
