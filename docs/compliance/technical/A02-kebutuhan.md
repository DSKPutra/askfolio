# A02 — Spesifikasi kebutuhan pemangku kepentingan & perangkat lunak (StRS + SRS)

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | A02 |
| Judul | Spesifikasi kebutuhan pemangku kepentingan & perangkat lunak (StRS + SRS) |
| Versi | 0.1.0 (= versi aplikasi) · commit `fd1db6c` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | 29 Dex, 206 kebutuhan |
| Standar acuan | ISO/IEC/IEEE 29148 (kebutuhan); ISO/IEC 25010:2023 (karakteristik kualitas produk) |
| Dokumen terkait | A07, A13 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

## 1. Pemangku kepentingan
| Pemangku kepentingan | Kepentingan utama |
|---|---|
| Pengguna umum (investor ritel, pelajar, pekerja) | jawaban berbasis data dengan sumber dan tanggal data; tanpa akun |
| Korban/calon korban penipuan | langkah darurat, kanal resmi, laporan siap kirim yang tetap di perangkat |
| Pemilik produk (Dea Saka Kurnia Putra) | kepatuhan lisensi data, biaya LLM terkendali, dokumentasi dapat diaudit |
| Penyedia data & pemegang lisensi | atribusi dan batas penggunaan (NC/komersial) dihormati |
| Regulator (Komdigi / lembaga PDP) | kepatuhan UU PDP dan PSE |

## 2. Kebutuhan fungsional per Dex
Satu kebutuhan per tab, dibangkitkan dari registry dan `feature_guide.json`. Karakteristik kualitas: kesesuaian fungsional.

| ID | Dex | Kebutuhan | Sumber |
|---|---|---|---|
| REQ-finandex-ai-001 | Pasar Global | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-002 | Pasar Global | Tab "Pasar Global": 34 aset global (indeks, komoditas, kripto, mata uang) dengan sparkline dan filter. (34 aset, sparkline, filter kategori/wilayah) | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-003 | Pasar Global | Tab "Bandingkan": Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-004 | Pasar Global | Tab "Korelasi": Matriks korelasi return antar-aset (1/3/5 tahun). (heatmap) | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-005 | Pasar Global | Tab "Kalender Return": Heatmap return tahunan per aset (tahun parsial ditandai). (heatmap tahun×aset) | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-006 | Pasar Global | Tab "Peristiwa": Pergerakan harga di sekitar peristiwa bertanggal pasti (krisis, keputusan bank sentral, halving). | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-finandex-ai-007 | Pasar Global | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L104 @ fd1db6c` |
| REQ-nasdaqdex-001 | Saham Teknologi AS | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-002 | Saham Teknologi AS | Tab "Pulse": Denyut pasar: breadth, % saham di atas SMA, indeks equal-weight vs indeks acuan. (breadth + indeks EW vs ^IXIC) | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-003 | Saham Teknologi AS | Tab "Screener": Saring saham dengan kriteria (return, volatilitas, valuasi, likuiditas). | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-004 | Saham Teknologi AS | Tab "Growth Lab": Saham dengan pertumbuhan terbesar: kelipatan harga, CAGR 5/10 tahun, jarak dari ATH. | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-005 | Saham Teknologi AS | Tab "Teknikal": Indikator teknikal deskriptif (SMA50/200, RSI14, golden/death cross) — bukan sinyal beli/jual. | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-006 | Saham Teknologi AS | Tab "Bandingkan": Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-nasdaqdex-007 | Saham Teknologi AS | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L130 @ fd1db6c` |
| REQ-snp500dex-001 | 500 Saham Besar AS | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-002 | 500 Saham Besar AS | Tab "Pulse": Denyut pasar: breadth, % saham di atas SMA, indeks equal-weight vs indeks acuan. | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-003 | 500 Saham Besar AS | Tab "Dividen": Riwayat dividen, dividend yield TTM, dan streak kenaikan dividen. | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-004 | 500 Saham Besar AS | Tab "Simulator": Simulasi nilai investasi historis dengan/tanpa reinvestasi dividen (bukan rekomendasi). | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-005 | 500 Saham Besar AS | Tab "Screener": Saring saham dengan kriteria (return, volatilitas, valuasi, likuiditas). | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-006 | 500 Saham Besar AS | Tab "Volume & Likuiditas": Volume, nilai transaksi, dan likuiditas saham. | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-snp500dex-007 | 500 Saham Besar AS | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L153 @ fd1db6c` |
| REQ-commercedex-001 | Raksasa E-Commerce | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-002 | Raksasa E-Commerce | Tab "Peta Global": Peta dunia perusahaan e-commerce per negara. | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-003 | Raksasa E-Commerce | Tab "Perusahaan": Profil perusahaan e-commerce dan kinerjanya. | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-004 | Raksasa E-Commerce | Tab "Fundamental": Data fundamental (pendapatan, laba, margin, ROE, DER, dll.) per tahun fiskal dengan mata uang laporan. | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-005 | Raksasa E-Commerce | Tab "Indeks E-Commerce": Indeks equal-weight saham e-commerce dunia dan kinerjanya. | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-006 | Raksasa E-Commerce | Tab "Makro": Indikator makro negara terkait perusahaan e-commerce (World Bank). | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-commercedex-007 | Raksasa E-Commerce | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L179 @ fd1db6c` |
| REQ-ipodex-001 | IPO Global | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-ipodex-002 | IPO Global | Tab "Ringkasan": Ringkasan utama dataset Dex ini dalam kartu & grafik. | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-ipodex-003 | IPO Global | Tab "Negara & Bursa": IPO per negara dan bursa. | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-ipodex-004 | IPO Global | Tab "India SME vs Mainboard": Perbandingan IPO India papan SME dan Mainboard. | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-ipodex-005 | IPO Global | Tab "Cari IPO": Cari IPO berdasarkan nama, negara, bursa, sektor, atau status. | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-ipodex-006 | IPO Global | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L206 @ fd1db6c` |
| REQ-idfinandex-001 | Ekonomi Indonesia | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-002 | Ekonomi Indonesia | Tab "Dashboard Makro": Ringkasan indikator makro Indonesia (BI rate, inflasi, kurs, suku bunga AS) dalam satu layar. | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-003 | Ekonomi Indonesia | Tab "Aset": Daftar aset dengan harga/nilai terakhir, perubahan, dan grafik per aset. | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-004 | Ekonomi Indonesia | Tab "Tren Ter-normalisasi": Tren beberapa aset yang dinormalisasi ke titik awal yang sama. | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-005 | Ekonomi Indonesia | Tab "Korelasi": Matriks korelasi return antar-aset (1/3/5 tahun). | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-006 | Ekonomi Indonesia | Tab "Rezim Suku Bunga": Return aset saat BI rate naik, turun, atau tetap. | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-idfinandex-007 | Ekonomi Indonesia | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L232 @ fd1db6c` |
| REQ-rupiahdex-001 | Kurs Rupiah | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-rupiahdex-002 | Kurs Rupiah | Tab "Kurs": Grafik kurs USD/IDR (garis & candlestick) dengan statistik. (garis + candlestick) | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-rupiahdex-003 | Kurs Rupiah | Tab "Konverter Historis": Konversi USD↔IDR memakai kurs pada tanggal tertentu. | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-rupiahdex-004 | Kurs Rupiah | Tab "Statistik Tahunan": Rata-rata, tertinggi, terendah, dan perubahan kurs per tahun. | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-rupiahdex-005 | Kurs Rupiah | Tab "Peristiwa": Pergerakan harga di sekitar peristiwa bertanggal pasti (krisis, keputusan bank sentral, halving). | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-rupiahdex-006 | Kurs Rupiah | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L258 @ fd1db6c` |
| REQ-idxdex-001 | Saham Indonesia | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-idxdex-002 | Saham Indonesia | Tab "Saham": Daftar & detail saham dengan grafik, return, risiko, dan likuiditas. | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-idxdex-003 | Saham Indonesia | Tab "Fundamental": Data fundamental (pendapatan, laba, margin, ROE, DER, dll.) per tahun fiskal dengan mata uang laporan. | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-idxdex-004 | Saham Indonesia | Tab "IPO Center": Statistik & daftar IPO BEI (e-IPO): return hari pertama, sektor, papan, penjamin. | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-idxdex-005 | Saham Indonesia | Tab "Direktori Emiten": Profil emiten BEI: sektor, papan, tanggal pencatatan, informasi perusahaan. | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-idxdex-006 | Saham Indonesia | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L280 @ fd1db6c` |
| REQ-reksadex-001 | Reksa Dana | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-002 | Reksa Dana | Tab "Industri": Ringkasan industri reksa dana: total dana kelolaan, jumlah produk, tren. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-003 | Reksa Dana | Tab "Manajer Investasi": Peringkat & pangsa manajer investasi berdasarkan dana kelolaan dan jumlah produk. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-004 | Reksa Dana | Tab "Cari Reksa Dana": Cari reksa dana berdasarkan nama, jenis, atau manajer investasi. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-005 | Reksa Dana | Tab "Peringkat": Peringkat terurut berdasarkan metrik pilihan. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-006 | Reksa Dana | Tab "Bank Kustodian": Pangsa bank kustodian reksa dana berdasarkan dana kelolaan. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-reksadex-007 | Reksa Dana | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L305 @ fd1db6c` |
| REQ-cryptdex-001 | Kripto & DeFi | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-002 | Kripto & DeFi | Tab "Pasar Kripto": Snapshot 250 koin: kapitalisasi, dominasi, perubahan harga, stablecoin (heuristik). (snapshot 250) | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-003 | Kripto & DeFi | Tab "Harga Historis": Grafik harga historis koin (garis/candlestick) dengan return per periode. | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-004 | Kripto & DeFi | Tab "DeFi": TVL DeFi, TVL per chain & protokol, suplai stablecoin, aktivitas DEX — dengan catatan hitung ganda. (TVL, chain, protokol, stablecoin, DEX) | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-005 | Kripto & DeFi | Tab "Yield": Pool yield DeFi (APY dasar & reward, TVL) dengan peringatan risiko — bukan rekomendasi. | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-006 | Kripto & DeFi | Tab "Fees & Revenue": Fee & revenue protokol DeFi per protokol/kategori dan trennya. | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-007 | Kripto & DeFi | Tab "Bot & AI Agent": Edukasi bot trading & AI agent kripto: profil, fakta terverifikasi, uji nyata, checklist keamanan — tanpa rekomendasi & tanpa tautan referral. (edukasi + keamanan) | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-cryptdex-008 | Kripto & DeFi | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L331 @ fd1db6c` |
| REQ-centralbankdex-001 | Bank Sentral Dunia | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-002 | Bank Sentral Dunia | Tab "Neraca G3": Neraca bank sentral The Fed, ECB, BoJ, dan gabungan G3. (Fed/ECB/BoJ) | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-003 | Bank Sentral Dunia | Tab "Suku Bunga & Kurva Imbal Hasil": Suku bunga kebijakan AS, imbal hasil Treasury, spread 10Y–2Y, dan periode inversi. | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-004 | Bank Sentral Dunia | Tab "Uang Beredar": Uang beredar (M2/broad money) AS dan negara lain. | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-005 | Bank Sentral Dunia | Tab "Peta Negara": Peta per negara untuk indikator Dex ini. | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-006 | Bank Sentral Dunia | Tab "Label Rezim": Label rezim likuiditas buatan penyedia dataset (ditandai sebagai label penyedia, bukan fakta). (penyedia) | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-centralbankdex-007 | Bank Sentral Dunia | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L359 @ fd1db6c` |
| REQ-inflationdex-001 | Inflasi Dunia | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-inflationdex-002 | Inflasi Dunia | Tab "Peta Inflasi": Peta inflasi antarnegara (tahun data ditampilkan). | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-inflationdex-003 | Inflasi Dunia | Tab "Peringkat": Peringkat terurut berdasarkan metrik pilihan. | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-inflationdex-004 | Inflasi Dunia | Tab "Biaya Barang": Harga barang & jasa sehari-hari antarnegara (roti, transport, sewa, utilitas). | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-inflationdex-005 | Inflasi Dunia | Tab "Wilayah & Pendapatan": Ringkasan per wilayah dunia dan kelompok pendapatan. | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-inflationdex-006 | Inflasi Dunia | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L385 @ fd1db6c` |
| REQ-startupdex-001 | Pendanaan Startup | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-002 | Pendanaan Startup | Tab "Ringkasan": Ringkasan utama dataset Dex ini dalam kartu & grafik. | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-003 | Pendanaan Startup | Tab "Tahapan": Pendanaan startup per tahap (Seed, Series A, dst.) dan median ukurannya. (Stage) | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-004 | Pendanaan Startup | Tab "Negara & Sektor": Pendanaan startup per negara dan sektor. | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-005 | Pendanaan Startup | Tab "Mega-round": Putaran pendanaan ≥ US$100 juta dan porsinya terhadap total. | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-006 | Pendanaan Startup | Tab "Cari Putaran": Cari putaran pendanaan startup berdasarkan perusahaan, tahap, negara, sektor, atau investor. | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-startupdex-007 | Pendanaan Startup | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L410 @ fd1db6c` |
| REQ-vcdex-001 | Direktori Investor | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcdex-002 | Direktori Investor | Tab "Direktori": Direktori investor yang bisa difilter (tipe, negara, tahap, jumlah deal). | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcdex-003 | Direktori Investor | Tab "Peringkat": Peringkat terurut berdasarkan metrik pilihan. | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcdex-004 | Direktori Investor | Tab "Stage Mix": Komposisi tahap pendanaan yang diikuti investor. | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcdex-005 | Direktori Investor | Tab "Negara": Statistik per negara untuk cakupan Dex ini. | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcdex-006 | Direktori Investor | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L437 @ fd1db6c` |
| REQ-vcnetworkdex-001 | Jaringan Investor | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L460 @ fd1db6c` |
| REQ-vcnetworkdex-002 | Jaringan Investor | Tab "Graf Jaringan": Graf ego jaringan co-investment investor (≤ 50 node) dengan ketebalan garis = jumlah deal bersama. | `src/config/dex-registry.ts#L460 @ fd1db6c` |
| REQ-vcnetworkdex-003 | Jaringan Investor | Tab "Pasangan Teratas": Pasangan investor yang paling sering berinvestasi bersama. | `src/config/dex-registry.ts#L460 @ fd1db6c` |
| REQ-vcnetworkdex-004 | Jaringan Investor | Tab "Investor": Profil investor dalam jaringan: mitra co-investment terbanyak & statistik. | `src/config/dex-registry.ts#L460 @ fd1db6c` |
| REQ-vcnetworkdex-005 | Jaringan Investor | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L460 @ fd1db6c` |
| REQ-opencompanydex-001 | Data Perusahaan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-opencompanydex-002 | Data Perusahaan | Tab "Peta Negara": Peta per negara untuk indikator Dex ini. | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-opencompanydex-003 | Data Perusahaan | Tab "Sektor & Industri": Jumlah & karakteristik perusahaan per sektor dan industri. | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-opencompanydex-004 | Data Perusahaan | Tab "Status & Pendanaan": Status perusahaan (aktif/tutup/diakuisisi) dan porsi yang pernah didanai. | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-opencompanydex-005 | Data Perusahaan | Tab "Cari Perusahaan": Cari perusahaan di direktori berdasarkan nama, negara, atau sektor. | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-opencompanydex-006 | Data Perusahaan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L485 @ fd1db6c` |
| REQ-salarydex-001 | Gaji Global | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-salarydex-002 | Gaji Global | Tab "Kalkulator Benchmark": Bandingkan gaji dengan median/persentil berdasarkan negara, peran, senioritas, dan skill. | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-salarydex-003 | Gaji Global | Tab "Negara": Statistik per negara untuk cakupan Dex ini. | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-salarydex-004 | Gaji Global | Tab "Peran & Senioritas": Gaji berdasarkan keluarga peran dan tingkat senioritas. | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-salarydex-005 | Gaji Global | Tab "Skill": Skill paling dicari dan premi gaji per skill. | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-salarydex-006 | Gaji Global | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L511 @ fd1db6c` |
| REQ-costlivingdex-001 | Biaya Hidup Kota | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-costlivingdex-002 | Biaya Hidup Kota | Tab "Peringkat Kota": Peringkat kota menurut indeks biaya hidup, sewa, kualitas hidup, dll. (data sintetis). | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-costlivingdex-003 | Biaya Hidup Kota | Tab "Profil Kota": Profil lengkap satu kota (biaya, kualitas hidup, keamanan, polusi, internet). | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-costlivingdex-004 | Biaya Hidup Kota | Tab "Bandingkan": Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-costlivingdex-005 | Biaya Hidup Kota | Tab "Perubahan 2023→2024": Perubahan indeks kota antara dua survei. | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-costlivingdex-006 | Biaya Hidup Kota | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L537 @ fd1db6c` |
| REQ-idhousingdex-001 | Rumah Subsidi | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-002 | Rumah Subsidi | Tab "Ringkasan": Ringkasan utama dataset Dex ini dalam kartu & grafik. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-003 | Rumah Subsidi | Tab "Provinsi & Kota": Statistik perumahan per provinsi dan kota/kabupaten. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-004 | Rumah Subsidi | Tab "Peta Proyek": Peta titik proyek perumahan (ter-cluster) dengan filter provinsi & status subsidi. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-005 | Rumah Subsidi | Tab "Spesifikasi": Spesifikasi rumah (kamar, lantai, material) per segmen. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-006 | Rumah Subsidi | Tab "Pengembang": Ringkasan pengembang & asosiasi pengembang perumahan. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idhousingdex-007 | Rumah Subsidi | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L562 @ fd1db6c` |
| REQ-idfooddeliverydex-001 | Harga Pesan-Antar Makanan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-002 | Harga Pesan-Antar Makanan | Tab "Ringkasan Markup": Ringkasan markup harga online vs dine-in, biaya kemasan, dan promo. | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-003 | Harga Pesan-Antar Makanan | Tab "Kota": Statistik per kota (markup food delivery). | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-004 | Harga Pesan-Antar Makanan | Tab "Kuliner": Statistik per jenis kuliner (harga, markup, promo). | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-005 | Harga Pesan-Antar Makanan | Tab "Cloud Kitchen": Perbandingan harga & markup cloud kitchen dengan restoran biasa. | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-006 | Harga Pesan-Antar Makanan | Tab "Cari Menu": Cari menu food delivery berdasarkan nama, kota, atau kuliner, lengkap dengan markup. | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-idfooddeliverydex-007 | Harga Pesan-Antar Makanan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L588 @ fd1db6c` |
| REQ-povertydex-001 | Kemiskinan Multidimensi | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-povertydex-002 | Kemiskinan Multidimensi | Tab "Peta MPI": Peta Indeks Kemiskinan Multidimensi per negara. | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-povertydex-003 | Kemiskinan Multidimensi | Tab "Peringkat": Peringkat terurut berdasarkan metrik pilihan. | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-povertydex-004 | Kemiskinan Multidimensi | Tab "Dimensi": Kontribusi 10 dimensi kemiskinan multidimensi per negara. | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-povertydex-005 | Kemiskinan Multidimensi | Tab "Bandingkan": Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-povertydex-006 | Kemiskinan Multidimensi | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L614 @ fd1db6c` |
| REQ-populationdex-001 | Berita Kependudukan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-002 | Berita Kependudukan | Tab "Tren Liputan": Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-003 | Berita Kependudukan | Tab "Geografi": Sebaran liputan berita per benua, negara, kota, atau negara bagian. | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-004 | Berita Kependudukan | Tab "Tema & Organisasi": Tema dan organisasi yang paling sering muncul dalam liputan berita. | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-005 | Berita Kependudukan | Tab "Riset & Paten": Tren publikasi riset dan paten terkait topik berita. | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-006 | Berita Kependudukan | Tab "Temuan Penyedia": Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-populationdex-007 | Berita Kependudukan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L639 @ fd1db6c` |
| REQ-homelessnessdex-001 | Berita Tunawisma | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-002 | Berita Tunawisma | Tab "Tren Liputan": Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-003 | Berita Tunawisma | Tab "Geografi": Sebaran liputan berita per benua, negara, kota, atau negara bagian. | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-004 | Berita Tunawisma | Tab "Tema & Organisasi": Tema dan organisasi yang paling sering muncul dalam liputan berita. | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-005 | Berita Tunawisma | Tab "Riset & Paten": Tren publikasi riset dan paten terkait topik berita. | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-006 | Berita Tunawisma | Tab "Temuan Penyedia": Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-homelessnessdex-007 | Berita Tunawisma | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L659 @ fd1db6c` |
| REQ-housingdex-001 | Berita Perumahan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-002 | Berita Perumahan | Tab "Tren Liputan": Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-003 | Berita Perumahan | Tab "Geografi": Sebaran liputan berita per benua, negara, kota, atau negara bagian. | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-004 | Berita Perumahan | Tab "Tema & Organisasi": Tema dan organisasi yang paling sering muncul dalam liputan berita. | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-005 | Berita Perumahan | Tab "Riset & Paten": Tren publikasi riset dan paten terkait topik berita. | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-006 | Berita Perumahan | Tab "Temuan Penyedia": Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-housingdex-007 | Berita Perumahan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L679 @ fd1db6c` |
| REQ-fintechdex-001 | Ulasan Aplikasi Fintech | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-fintechdex-002 | Ulasan Aplikasi Fintech | Tab "Sentimen": Distribusi sentimen (label otomatis penyedia) per platform, bulan, atau bahasa. | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-fintechdex-003 | Ulasan Aplikasi Fintech | Tab "Topik & Aspek": Topik & aspek ulasan (UX, harga, produk, layanan, keamanan, merek) beserta sentimennya. | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-fintechdex-004 | Ulasan Aplikasi Fintech | Tab "Jelajah Ulasan": Telusuri ulasan produk fintech tanpa identitas penulis. | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-fintechdex-005 | Ulasan Aplikasi Fintech | Tab "Tren": Tren bulanan jumlah unggahan dan porsi sentimen. | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-fintechdex-006 | Ulasan Aplikasi Fintech | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L699 @ fd1db6c` |
| REQ-personalfinandex-001 | Diskusi Keuangan Pribadi | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-personalfinandex-002 | Diskusi Keuangan Pribadi | Tab "Sentimen": Distribusi sentimen (label otomatis penyedia) per platform, bulan, atau bahasa. | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-personalfinandex-003 | Diskusi Keuangan Pribadi | Tab "Topik": Topik diskusi yang paling sering muncul. | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-personalfinandex-004 | Diskusi Keuangan Pribadi | Tab "Jelajah Diskusi": Telusuri diskusi keuangan pribadi (judul/ringkasan/platform/tanggal) tanpa identitas penulis. | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-personalfinandex-005 | Diskusi Keuangan Pribadi | Tab "Tren": Tren bulanan jumlah unggahan dan porsi sentimen. | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-personalfinandex-006 | Diskusi Keuangan Pribadi | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L724 @ fd1db6c` |
| REQ-mylaiwyer-001 | Tanya Hukum Umum | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-002 | Tanya Hukum Umum | Tab "Konsultasi Terpandu": Tanya-jawab bertahap dengan pilihan (chip): situasi Anda → langkah yang bisa dilakukan + dasar hukum resmi. | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-003 | Tanya Hukum Umum | Tab "Sumber Hukum": Daftar dokumen hukum: tersedia (sudah diverifikasi) dan menunggu dokumen, dengan tautan resmi. (tersedia & menunggu dokumen) | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-004 | Tanya Hukum Umum | Tab "Jelajah Pasal": Daftar isi per dokumen hukum (Pembukaan/Bab/Pasal/Penjelasan/Lampiran) dengan pencarian. | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-005 | Tanya Hukum Umum | Tab "Bandingkan Versi": Teks pasal berdampingan antar-versi peraturan (KUHAP 1981 ↔ 2025; UUD naskah asli ↔ UUD NRI 1945). (KUHAP 1981–2025; UUD naskah asli–UUD NRI 1945) | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-006 | Tanya Hukum Umum | Tab "Glosarium": Istilah hukum/keuangan dijelaskan dalam bahasa awam. | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-mylaiwyer-007 | Tanya Hukum Umum | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L749 @ fd1db6c` |
| REQ-finlaiwyer-001 | Tanya Hak Keuangan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-002 | Tanya Hak Keuangan | Tab "Konsultasi Terpandu": Tanya-jawab bertahap dengan pilihan (chip): situasi Anda → langkah yang bisa dilakukan + dasar hukum resmi. | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-003 | Tanya Hak Keuangan | Tab "Peta Regulasi Keuangan": Graf peraturan keuangan & perbankan: mana mengubah, mencabut, atau disesuaikan; klik untuk status & pasal kunci. (graf relasi ubah/cabut/disesuaikan) | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-004 | Tanya Hak Keuangan | Tab "Jelajah Pasal": Daftar isi per dokumen hukum (Pembukaan/Bab/Pasal/Penjelasan/Lampiran) dengan pencarian. | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-005 | Tanya Hak Keuangan | Tab "Status & Perubahan": Linimasa status peraturan: berlaku, diubah, dicabut, dan penyesuaian ancaman pidana oleh UU 1/2026. (linimasa + penyesuaian UU 1/2026) | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-006 | Tanya Hak Keuangan | Tab "Kanal Pengaduan": Ke mana mengadu (bank/PUJK, OJK 157/APPK, BI 131, LAPS SJK) dan urutannya. | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-007 | Tanya Hak Keuangan | Tab "Glosarium": Istilah hukum/keuangan dijelaskan dalam bahasa awam. | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-finlaiwyer-008 | Tanya Hak Keuangan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L782 @ fd1db6c` |
| REQ-antiscamdex-001 | Lawan Penipuan | Tab "Chat": Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-002 | Lawan Penipuan | Tab "Baru Kena Scam": Layar darurat: dua pertanyaan (kapan & lewat apa) lalu langkah segera dengan tombol kanal resmi. (langkah darurat) | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-003 | Lawan Penipuan | Tab "Siapkan Laporan": Wizard offline untuk menyiapkan data & kronologi sesuai formulir IASC; data tidak pernah meninggalkan perangkat. (offline) | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-004 | Lawan Penipuan | Tab "Statistik Penanganan": Statistik IASC & Satgas PASTI: laporan, rekening diblokir, dana diblokir & dikembalikan, modus, wilayah — per tanggal potong & sumber. | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-005 | Lawan Penipuan | Tab "Kenali Modus": Pustaka modus scam, tanda bahaya, dan kuis cek-mandiri "Apakah ini scam?". (+ kuis cek-mandiri) | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-006 | Lawan Penipuan | Tab "Kanal Resmi": Direktori kanal resmi (IASC, OJK, SiPASTI, BI, cekrekening.id, aduannomor.id, Polri, LAPS SJK) dan kapan memakainya. | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-007 | Lawan Penipuan | Tab "Cegah & Bukti": Tips pencegahan scam dan daftar bukti yang perlu diamankan sebelum melapor. | `src/config/dex-registry.ts#L816 @ fd1db6c` |
| REQ-antiscamdex-008 | Lawan Penipuan | Tab "Data": File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. | `src/config/dex-registry.ts#L816 @ fd1db6c` |

## 3. Kebutuhan lintas aplikasi & non-fungsional
Dipetakan ke sembilan karakteristik kualitas ISO/IEC 25010:2023.

| ID | Kebutuhan | Karakteristik kualitas | Sumber |
|---|---|---|---|
| REQ-app-001 | Persetujuan chat (versi kebijakan) sebelum pesan pertama; ditanya ulang bila versi berubah | Keamanan | `src/components/ConsentDialog.tsx @ fd1db6c` |
| REQ-app-002 | Pesan yang tampak berisi seed phrase, private key, nomor kartu, atau NIK diblokir di klien dan server | Keamanan | `src/shared/text.ts @ fd1db6c` |
| REQ-app-003 | Pembatasan laju per clientId + IP (jendela 10 menit dan harian) serta anggaran token harian | Keandalan | `server/security/ratelimit.ts @ fd1db6c` |
| REQ-app-004 | Angka dalam jawaban hanya dari keluaran tool; klaim tanpa bukti dihapus Verifikator | Kesesuaian fungsional | `server/agents/verifier.ts @ fd1db6c` |
| REQ-app-005 | Orkestrasi multi-agen: Penjaga → Konduktor (≤ 4 spesialis) → agen Dex → Verifikator, dialirkan sebagai event SSE | Kesesuaian fungsional | `server/agents/run.ts @ fd1db6c` |
| REQ-app-006 | Aplikasi dapat dibuka offline (service worker, cache data yang pernah dibuka) | Keandalan | `vite.config.ts @ fd1db6c` |
| REQ-app-007 | Halaman /install: petunjuk pemasangan iPhone/iPad/Android/macOS/Windows dan QR | Kapabilitas interaksi | `src/features/install/InstallCenter.tsx @ fd1db6c` |
| REQ-app-008 | Kontras teks ≥ 4,5 : 1 pada kedua tema; navigasi keyboard; lulus pemeriksaan axe | Kapabilitas interaksi | `tests/unit/contrast.test.ts @ fd1db6c` |
| REQ-app-009 | Isian "Siapkan Laporan" AntiScamDex terenkripsi AES-GCM di perangkat, terhapus otomatis setelah 30 hari kecuali disimpan | Keamanan | `src/lib/secure-store.ts @ fd1db6c` |
| REQ-app-010 | Konsultasi Terpandu hukum: alur pertanyaan bercabang dengan rujukan pasal dari teks resmi | Kesesuaian fungsional | `kit/datasets/law/legal_qa_flows.json @ fd1db6c` |
| REQ-app-011 | Panduan Fitur menjawab "fitur ini untuk apa?" dari feature_guide.json | Kapabilitas interaksi | `kit/datasets/app/feature_guide.json @ fd1db6c` |
| REQ-app-012 | Bundel awal ≤ 250 KB gzip | Efisiensi kinerja | `package.json @ fd1db6c` |
| REQ-app-013 | Kuesioner profil risiko (kemauan vs kemampuan, 8 pertanyaan) → profil = yang lebih rendah; pencocokan kelas aset edukatif tanpa produk, jawaban hanya di perangkat | Keselamatan | `src/shared/risk-profile.ts @ fd1db6c` |

## 4. Kriteria penerimaan
Setiap kebutuhan diterima bila tes yang tertaut di A13 lulus pada rilis yang sama dan gate `npm run verify` hijau. Hasil terakhir: 909/909 tes unit/komponen lulus; eval chat mock 161/161.
