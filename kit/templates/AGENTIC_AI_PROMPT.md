# Prompt — Finandex Agentic AI: setiap fitur dijalankan agen sendiri + visualisasi agen bekerja

> © 2026 Dea Saka Kurnia Putra. All rights reserved.
> Jalankan di Claude Code pada repo Finandex (Master Prompt v3.x). Prompt ini **memperluas §8 (Chatbot)** menjadi sistem multi-agen; aturan lain (angka hanya dari data, kutipan hukum hanya dari teks resmi, privasi, hak cipta) tetap berlaku. Simpan juga sebagai `kit/templates/AGENTIC_AI_PROMPT.md`.

---

## 1. Tujuan
Ubah setiap Dex dari "chatbot dengan tool" menjadi **agen AI** yang punya **peran, keahlian (skills), pengetahuan (dataset), alat (tools), batas, dan evaluasi sendiri**. Satu agen konduktor membagi pekerjaan ke agen spesialis, menjalankan mereka paralel bila perlu, lalu menggabungkan hasil menjadi satu kartu jawaban. Pengguna dapat **melihat agen-agen bekerja** secara langsung.

## 2. Susunan agen
| Agen | Peran |
|---|---|
| **Konduktor** (lapisan perencana Finandex AI) | Memahami pertanyaan, membuat rencana, memilih agen spesialis, membagi tugas, menggabungkan & menyelesaikan konflik hasil, menyusun kartu jawaban. Tools: `delegate`, `open_dex`, `feature_guide` |
| **29 agen Dex** (satu per Dex, termasuk Agen Finandex AI untuk pasar global; mis. Agen CryptDex, Agen RupiahDex, Agen FinLAIwyer, Agen AntiScamDex) | Mengerjakan tugas di domainnya memakai dataset, tools (§8.4–8.5), dan skills miliknya |
| **Agen Verifikator** (bersama) | Memeriksa setiap angka di narasi ada di hasil tool, setiap kutipan hukum ada persis di chunk resmi, as-of & sumber tercantum, tidak ada klaim di luar data. Tools: `match_numbers`, `match_quotes` (deterministik), LLM haiku hanya untuk kasus ambigu |
| **Agen Penjaga** (bersama) | Pagar keselamatan di pintu masuk & keluar: data sensitif (OTP, PIN, NIK, kartu, seed phrase), nasihat investasi/hukum, prompt injection, tidak meniru lembaga resmi, tidak meneruskan laporan. Tools: `pii_scan`, `policy_check` |

Total 32 agen: 1 Konduktor + 29 agen Dex + 2 agen bersama.

Saat pengguna membuka Dex tertentu, agen Dex itu menjadi agen utama; Konduktor tetap dipakai bila pertanyaan menyentuh domain lain (mis. FinLAIwyer memanggil Agen AntiScamDex untuk kanal resmi, Agen RupiahDex memanggil Agen IDFinanDex untuk BI rate).

## 3. Kartu agen — `src/config/agents.ts` (dibangkitkan dari `dex-registry.ts` + `feature_guide.json`)
```ts
type AgentCard = {
  id: AgentId; dexId?: DexId; name: string; role: { id: string; en: string };
  model: 'claude-sonnet-5-5' | 'claude-haiku-5-5';      // Konduktor & spesialis: sonnet; Verifikator & router cepat: haiku
  knowledge: { datasets: string[]; asOf: string; corpus?: 'umum' | 'keuangan' };
  tools: string[];                                      // subset tool §8.4–8.5 milik Dex itu (read-only)
  skills: { id: string; title: string; description: string }[];   // §4
  handoffs: AgentId[];                                  // agen lain yang boleh dimintai bantuan
  limits: { maxTurns: number; maxTools: number; maxTokens: number; timeoutMs: number };
  guardrails: string[];                                 // aturan khusus (mis. "bukan nasihat hukum", "data sintetis")
  evalSuite: string;                                    // id set eval agen
};
```
Halaman `/agents` dan "Tentang fitur ini" menampilkan kartu agen ini (peran, keahlian, data, as-of, batas).

## 4. Skills per agen
- Folder `server/agents/<agentId>/skills/<skillId>.md`: prosedur langkah demi langkah untuk satu jenis tugas (kapan dipakai, tools yang dipanggil berurutan, aturan pembersihan yang relevan, format hasil, jebakan). Contoh: CryptDex — "TVL DeFi dengan koreksi hitung ganda", "cek keamanan bot"; RupiahDex — "konversi historis", "kurs saat peristiwa"; FinLAIwyer — "konsultasi korban scam", "status & penyesuaian pidana UU 1/2026"; AntiScamDex — "langkah darurat", "baca statistik IASC per tanggal potong"; IDXDex — "screening fundamental", "statistik IPO".
- **Progressive disclosure:** system prompt agen hanya memuat daftar judul + deskripsi skill; isi skill dimuat lewat tool `load_skill(skillId)` saat dibutuhkan (hemat token, *prompt caching* per agen).
- Minimal 3 skill per agen, ditulis dari §4, §8, §9 master prompt dan `feature_guide.json`. Setiap skill punya tes (eval) sendiri.

## 5. Orkestrasi (server)
1. **Rencana:** Konduktor menghasilkan rencana terstruktur (zod): `{ intent, agents: [{ id, task, inputs, needs: [] }], parallel: boolean }`. Maks 4 agen spesialis per pertanyaan; kedalaman delegasi maks 1 (spesialis boleh meminta 1 *handoff*, tidak boleh memanggil berantai).
2. **Delegasi:** tool Konduktor `delegate(agentId, task, context)` menjalankan loop agen spesialis (§8.3 per agen) dengan batas kartunya; agen independen dijalankan **paralel**.
3. **Pesan antar-agen** bertipe, bukan teks bebas: `AgentResult { agentId, summary, facts: [{ value, unit, asOf, source, toolCallId }], artifacts[], method[], citations[], flags[], confidence: 'data'|'partial'|'none' }`. Teks dataset tetap masuk hanya sebagai hasil tool.
4. **Verifikasi:** Agen Verifikator memeriksa gabungan hasil secara deterministik dulu (pencocokan angka & kutipan), lalu LLM bila perlu. Gagal → Konduktor memperbaiki atau menghapus klaim; tidak boleh mengirim klaim yang tidak terverifikasi.
5. **Penjaga** berjalan sebelum rencana (pesan masuk) dan sebelum jawaban dikirim.
6. **Batas global:** tenggat `CHAT_DEADLINE_MS` tetap (hasil parsial dikirim dengan label "sebagian agen belum selesai"), anggaran token per permintaan & harian, retry sekali untuk 429/529.
7. **Aksi agen:** semua tool tetap **read-only**. Aksi di aplikasi (buka tab, isi Baki Banding, tambah watchlist, buat PDF ringkasan lokal, buka kanal resmi) diusulkan agen sebagai `proposed_action` dan **baru dijalankan setelah pengguna menekan konfirmasi**. Tidak ada aksi eksternal otonom (tidak mengirim laporan, tidak bertransaksi, tidak mengisi formulir pihak lain).
8. **Memori:** hanya memori kerja per percakapan; tidak ada memori jangka panjang di server. Preferensi pengguna tetap di perangkat.

## 6. Protokol SSE tambahan (§8.2)
| event | data |
|---|---|
| `plan` | `{ intent, agents: [{ id, task }], parallel }` |
| `agent_start` | `{ agentId, task, model }` |
| `agent_status` | `{ agentId, phase: 'planning'|'loading_skill'|'calling_tool'|'reading_data'|'verifying'|'writing', label, tool?, skill? }` |
| `agent_handoff` | `{ from, to, reason }` |
| `agent_result` | `AgentResult` ringkas (tanpa data berat) |
| `verify` | `{ passed: boolean, checked: number, removed_claims: number }` |
| `agent_done` | `{ agentId, elapsed_ms, tools_used, tokens }` |

Event lama (`text`, `artifact`, `method`, `citation`, `done`, `error`) tetap ada; setiap `artifact`/`method`/`citation` kini membawa `agentId`.

## 7. Visualisasi "agen bekerja": Kantor Agen 3D
Acuan visual: `kit/templates/agents_office_mockup.html` (mockup interaktif; urutan event di dalamnya adalah contoh protokol §6, bukan data nyata).

1. **Kantor Agen 3D** (`src/features/agents/office/`, three.js, dimuat *lazy* hanya di halaman `/agents` dan panel "Lihat kantor" di chat):
   - **8 ruangan = 8 kategori §10.2.** Setiap agen Dex duduk di mejanya sendiri dengan monitor; warna baju & lantai ruangan memakai palet seri kategori itu. Label ruangan menampilkan nama kategori, jumlah agen, dan jumlah agen yang sedang bekerja; klik label → kamera fokus ke ruangan.
   - **Koridor tengah:** meja bundar **Konduktor** di tengah; **Penjaga** di gerbang lobi (pintu masuk & keluar, pertanyaan masuk dan jawaban keluar sama-sama melewatinya); **Verifikator** di ujung koridor dengan stempel dan kotak "klaim dihapus".
   - **Animasi digerakkan event SSE nyata:** pertanyaan masuk sebagai amplop (lobi → Penjaga → Konduktor); `agent_start` = kartu tugas terbang dari Konduktor ke meja agen; `agent_status` = layar monitor menampilkan fase & nama tool dengan warna provenance, tangan mengetik, cincin status di lantai; `agent_handoff` = agen berdiri, berjalan lewat pintu & koridor membawa dokumen ke meja agen tujuan, lalu kembali; `agent_done` = kartu hasil kembali ke Konduktor, monitor menampilkan centang; `verify` = stempel turun, klaim yang dihapus jatuh ke kotak; `done` = jawaban keluar lewat Penjaga.
   - **Interaksi:** putar/zoom kamera, mode "Ikuti aksi" (kamera bergeser ke agen yang bekerja; mati otomatis saat pengguna menggerakkan kamera), klik agen → panel detail (peran, model, tools, skills, dataset & as-of, langkah terakhir).
   - **Tema:** semua warna adegan dari token tema aktif (Obligasi/Brankas bila recolor dijalankan); bereaksi saat tema berganti.
2. **Jejak (trace) per agen**: daftar langkah berurutan dengan durasi, tool & parameter dalam bahasa manusia, skill yang dipakai, fakta yang dihasilkan (klik → menyorot angka di kartu jawaban). Warna mengikuti token provenance (data, AI, kutipan resmi, flag).
3. **Kartu jawaban berlabel agen**: setiap grafik, angka, dan kutipan menampilkan lencana agen sumbernya.
4. **Halaman `/agents` ("Ruang Agen")**: Kantor Agen 3D + aliran event + jejak + daftar agen per ruangan (peran, skills, dataset & as-of, tools, statistik eval). Di Beranda, node Konstelasi Indeks menyala saat agennya aktif di sesi pengguna.
5. **Aksesibilitas & performa**:
   - Daftar agen per ruangan dalam HTML biasa selalu tersedia (padanan teks untuk pembaca layar & *fallback* bila WebGL tidak ada atau perangkat lemah). Log `aria-live` mengumumkan agen mulai, handoff, selesai, dan hasil verifikasi.
   - `prefers-reduced-motion`: kamera statis, tanpa orang berjalan atau kartu terbang; status tetap terlihat dari layar monitor, cincin lantai, dan label.
   - Animasi hanya dari event nyata (bukan pura-pura sibuk). DPR maks 2 (1,5 di mobile), bayangan mati di mobile, render berhenti saat tab tersembunyi atau kanvas di luar layar, target ≥ 30 fps di ponsel kelas menengah, bundle 3D terpisah dan tidak memperlambat halaman lain.
   - Tidak ada informasi yang hanya disampaikan lewat warna: setiap status punya label teks.

## 8. Evaluasi & gate
- **Eval routing**: set pertanyaan → agen yang benar dipanggil (presisi & recall ≥ 95%), termasuk pertanyaan lintas domain (mis. "kena scam + kurs rupiah + pasal penipuan").
- **Eval per agen**: item lama `chatbot_eval.json` dipetakan ke agen; tambah ≥ 3 item per skill; mock 100%, live ≥ 95%, keamanan 100%.
- **Eval kolaborasi**: konflik antar-agen diselesaikan tanpa merata-rata diam-diam; hasil parsial berlabel; tidak ada klaim lolos tanpa verifikasi.
- **Biaya & latensi**: median waktu jawaban ≤ 12 dtk untuk 1 agen, ≤ 20 dtk untuk 3 agen paralel (mock + live sampel); token per permintaan tercatat.
- **UI**: E2E memastikan event SSE agen dirender di Kantor Agen 3D dan panel jejak (urutan, status, selesai), daftar teks per ruangan sinkron dengan status 3D, reduced-motion mematikan gerakan, *fallback* tanpa WebGL berfungsi, fps & ukuran bundle 3D tercatat.
- Perbarui dokumen kepatuhan: A03 (arsitektur multi-agen), A10 (sistem AI: daftar agen, model, batas, risiko *excessive agency*), AI-BOM (§16.4).

## 9. Laporan
Tabel agen (id, peran, jumlah skill, tools, dataset, model, hasil eval), hasil eval routing & kolaborasi, latensi median, contoh 3 trace, tangkapan layar Kantor Agen 3D (tampilan penuh, fokus ruangan, saat handoff, tema terang & gelap, mobile) dan `/agents` di `docs/ui-review/agents/`.
