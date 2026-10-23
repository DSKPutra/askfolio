// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Build kit/whitepaper/Finandex_Platform_Overview.pptx (Bahasa Indonesia) from kit data only.
// Requires: pptxgenjs, react, react-dom, react-icons, sharp. Usage: node kit/whitepaper/build_deck.js kit [path/to/apply_theme.js]
// --uts: build kit/whitepaper/Finandex_UTS_Kelompok.pptx — same 18 slides, UTS cover with the group members, the
//        "Obligasi & Brankas" (dark) palette (no neon outside logos/icons), UTS metadata and one UTS line on slide 18.
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const pptxgen = require("pptxgenjs");
const React = require("react"), RDS = require("react-dom/server"), sharp = require("sharp");
const fa = require("react-icons/fa");

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const UTS = process.argv.includes("--uts");
const KIT = path.resolve(ARGS[0] || path.join(__dirname, ".."));
const WP = path.join(KIT, "whitepaper");
const J = (p) => JSON.parse(fs.readFileSync(path.join(KIT, p), "utf8"));
const fg = J("datasets/app/feature_guide.json"), ag = J("golden/antiscam/golden.json"), ev = J("golden/chatbot_eval.json");
const lc = J("golden/law_catalog/golden.json"), flows = J("golden/legal_flows/golden.json"), man = J("manifest/input_files_manifest.json");
const idn = (x, d = 0) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const miliar = (v) => "Rp" + idn(v / 1e9, (v / 1e9) % 1 ? (Math.round((v / 1e9) * 100) % 10 ? 2 : 1) : 0) + " M";
const pages = (f) => { try { return execSync(`pdfinfo "${path.join(WP, f)}"`).toString().match(/Pages:\s+(\d+)/)[1]; } catch { return null; } };

const THEME = UTS
  ? { name: "Finandex Brankas", headFontFace: "Arial", bodyFontFace: "Calibri",
      colors: { dk1: "E6EEE7", lt1: "0F1F19", dk2: "9FB5A6", lt2: "152A23", accent1: "5BC795", accent2: "79C6D2", accent3: "E3AE55", accent4: "EE8E79",
                accent5: "B3A4F0", accent6: "6FD0B8", hlink: "79C6D2", folHlink: "B3A4F0" } }
  : { name: "Finandex Nocturne", headFontFace: "Arial", bodyFontFace: "Calibri",
      colors: { dk1: "E9F5EC", lt1: "07130D", dk2: "93AE9D", lt2: "0C1D15", accent1: "19F23A", accent2: "3FD9FF", accent3: "FFB23E", accent4: "FF6B5E",
                accent5: "B79CFF", accent6: "2ED3B7", hlink: "3FD9FF", folHlink: "B79CFF" } };
// UTS uses the "Brankas" tokens of THEME_RECOLOR_PROMPT §3 (data/primary #5BC795 replaces the neon #19F23A); edge =
// rgba(190,225,200,0.14) composited over the page colour #0F1F19.
const HEX = UTS
  ? { bg: "0F1F19", pane: "152A23", pane2: "1C362D", ink: "E6EEE7", muted: "9FB5A6", phos: "5BC795", ion: "79C6D2", amber: "E3AE55", coral: "EE8E79", paper: "E9DFC7", edge: "283A31" }
  : { bg: "07130D", pane: "0C1D15", pane2: "12291E", ink: "E9F5EC", muted: "93AE9D", phos: "19F23A", ion: "3FD9FF", amber: "FFB23E", coral: "FF6B5E", paper: "F3EEDF", edge: "24412F" };
// UTS cover data (copied verbatim from UTS_PPTX_PROMPT §2). Optional fields stay null until the owner provides them;
// null fields are omitted (never shown as placeholders).
const UTS_COVER = {
  label: "UJIAN TENGAH SEMESTER (UTS)",
  title: "Finandex",
  subtitle: "Gambaran Platform & Tech Stack",
  members: [["261012000111", "DEA SAKA KURNIA PUTRA"], ["261012000045", "ROSSY ARTANTI ZULAIEKHA"], ["261012000093", "TAJUL TABRIZI"]],
  course: null, lecturer: null, program: null, university: null, term: null, date: null, campusLogo: null,
};
const COPY = "© 2026 Dea Saka Kurnia Putra. Hak cipta dilindungi undang-undang.";

async function icon(Comp, color, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
const png = (p) => "image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  if (UTS) { pres.author = "DEA SAKA KURNIA PUTRA; ROSSY ARTANTI ZULAIEKHA; TAJUL TABRIZI"; pres.company = "Finandex"; pres.title = "Finandex — Gambaran Platform & Tech Stack (UTS)"; pres.subject = "Ujian Tengah Semester (UTS)"; }
  else { pres.author = "Dea Saka Kurnia Putra"; pres.company = "Finandex"; pres.title = "Finandex — Gambaran Platform & Tech Stack"; pres.subject = "Presentasi platform Finandex"; }
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  // UTS: explicit Brankas colours for placeholders (scheme colours depend on an external theme module that may be absent,
  // which would render titles black on the dark background); titles left-aligned.
  const T1 = UTS ? HEX.ink : C.text1, T2 = UTS ? HEX.muted : C.text2, AL = UTS ? { align: "left" } : {};

  pres.defineSlideMaster({ title: "FX_TITLE", background: { color: HEX.bg },
    objects: [{ placeholder: { options: Object.assign({ name: "title", type: "title", x: 0.8, y: 2.2, w: 7.4, h: 1.3, fontSize: 54, bold: true, color: T1, fontFace: "Arial", margin: 0, valign: "bottom" }, AL), text: "" } },
              { placeholder: { options: Object.assign({ name: "body", type: "body", x: 0.8, y: 3.6, w: 7.0, h: 1.2, fontSize: 20, color: T2, margin: 0, valign: "top" }, AL), text: "" } }] });
  if (UTS) pres.defineSlideMaster({ title: "FX_UTS", background: { color: HEX.bg },
    objects: [{ placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.3, w: 7.4, h: 1.05, fontSize: 60, bold: true, color: T1, fontFace: "Arial", margin: 0, valign: "bottom", align: "left" }, text: "" } },
              { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 2.45, w: 7.4, h: 0.5, fontSize: 20, color: HEX.ink, margin: 0, valign: "top", align: "left" }, text: "" } }] });
  pres.defineSlideMaster({ title: "FX_CONTENT", background: { color: HEX.bg }, margin: [0.5, 0.6, 0.7, 0.6],
    objects: [{ placeholder: { options: Object.assign({ name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontSize: 34, bold: true, color: T1, fontFace: "Arial", margin: 0, valign: "middle" }, AL), text: "" } },
              { text: { text: COPY, options: { x: 0.6, y: 7.0, w: 8.0, h: 0.3, fontSize: 10, color: HEX.muted, margin: 0 } } }],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.muted, align: "right" } });

  // motif: deterministic mini-constellation
  function constellation(slide, x0, y0, w, h, n, seed) {
    let s = seed; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const pts = Array.from({ length: n }, () => [x0 + r() * w, y0 + r() * h]);
    const core = [x0 + w * 0.55, y0 + h * 0.5];
    pts.forEach(([x, y], i) => { if (i % 2 === 0) {
      const lx = Math.min(x, core[0]), ly = Math.min(y, core[1]), lw = Math.max(Math.abs(x - core[0]), 0.01), lh = Math.max(Math.abs(y - core[1]), 0.01);
      slide.addShape(pres.ShapeType.line, { x: lx, y: ly, w: lw, h: lh, flipV: (x < core[0]) !== (y < core[1]), line: { color: HEX.edge, width: 0.75 }, objectName: "motif-line" }); } });
    pts.forEach(([x, y], i) => slide.addShape(pres.ShapeType.ellipse, { x: x - 0.045, y: y - 0.045, w: i % 3 ? 0.09 : 0.14, h: i % 3 ? 0.09 : 0.14, fill: { color: HEX.phos, transparency: i % 3 ? 45 : 0 }, line: { color: HEX.phos, width: 0 }, objectName: "motif-node" }));
    slide.addShape(pres.ShapeType.ellipse, { x: core[0] - 0.13, y: core[1] - 0.13, w: 0.26, h: 0.26, fill: { color: HEX.bg }, line: { color: HEX.phos, width: 2 }, objectName: "motif-core" });
  }
  const pane = (slide, x, y, w, h, name, fill = HEX.pane) => slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.14, fill: { color: fill }, line: { color: HEX.edge, width: 0.75 }, objectName: name });
  const text = (slide, t, o) => slide.addText(t, Object.assign({ isTextBox: true, margin: 0, color: HEX.ink, fontSize: 14, valign: "top" }, o));
  const section = (t) => pres.addSection({ title: t });

  const IC = {};
  for (const [k, comp, col] of [["data", fa.FaDatabase, HEX.phos], ["robot", fa.FaRobot, HEX.ion], ["shield", fa.FaShieldAlt, HEX.coral], ["scale", fa.FaBalanceScale, HEX.paper],
    ["phone", fa.FaMobileAlt, HEX.phos], ["tablet", fa.FaTabletAlt, HEX.phos], ["laptop", fa.FaLaptop, HEX.ion], ["desktop", fa.FaDesktop, HEX.ion], ["lock", fa.FaLock, HEX.phos],
    ["eye", fa.FaUserSecret, HEX.amber], ["key", fa.FaKey, HEX.amber], ["code", fa.FaCodeBranch, HEX.phos], ["check", fa.FaCheckCircle, HEX.phos], ["file", fa.FaFilePdf, HEX.paper],
    ["search", fa.FaSearch, HEX.ion], ["chart", fa.FaChartLine, HEX.phos], ["globe", fa.FaGlobeAsia, HEX.ion], ["warn", fa.FaExclamationTriangle, HEX.amber], ["book", fa.FaBookOpen, HEX.paper]])
    IC[k] = await icon(comp, col);
  const DI = (id) => png(path.join(KIT, "brand/icons", `${id}-192.png`));

  // ---------------------------------------------------------------- 1. Title
  section("Pembuka");
  let s;
  if (UTS) {
    // UTS cover (UTS_PPTX_PROMPT §3): left ≈ 60 % — label, course (optional), title, subtitle, members table, details line;
    // right — app icon + constellation motif (smaller), campus logo top-right when provided.
    const U = UTS_COVER;
    s = pres.addSlide({ masterName: "FX_UTS", sectionTitle: "Pembuka" });
    text(s, U.label, { x: 0.8, y: 0.6, w: 7.4, h: 0.35, fontSize: 14, bold: true, color: HEX.phos, charSpacing: 4, objectName: "uts-label" });
    if (U.course) text(s, U.course, { x: 0.8, y: 0.98, w: 7.4, h: 0.32, fontSize: 16, color: HEX.ink, objectName: "uts-course" });
    s.addText(U.title, { placeholder: "title" });
    s.addText(U.subtitle, { placeholder: "body" });
    text(s, "Anggota Kelompok", { x: 0.8, y: 3.35, w: 7.4, h: 0.35, fontSize: 14, bold: true, color: HEX.ink, objectName: "uts-members-title" });
    const line = { pt: 0.75, color: HEX.edge }, none = { type: "none" };
    const cell = (t, o) => ({ text: t, options: Object.assign({ color: HEX.ink, fontSize: 16, border: [none, none, line, none], valign: "middle" }, o) });
    s.addTable([[cell("NIM", { fontSize: 12, bold: true, color: HEX.muted }), cell("NAMA", { fontSize: 12, bold: true, color: HEX.muted })],
                ...U.members.map(([nim, nama]) => [cell(nim, { fontFace: "Consolas" }), cell(nama)])],
      { x: 0.8, y: 3.8, w: 7.4, colW: [2.4, 5.0], rowH: [0.38, 0.5, 0.5, 0.5], margin: [0.04, 0.08, 0.04, 0.0], objectName: "uts-members" });
    const details = [U.lecturer, U.program, U.university, U.term, U.date].filter(Boolean);
    if (details.length) text(s, details.join(" · "), { x: 0.8, y: 6.05, w: 7.4, h: 0.3, fontSize: 12, color: HEX.muted, objectName: "uts-details" });
    if (U.campusLogo) s.addImage({ path: U.campusLogo, x: 11.6, y: 0.35, w: 1.3, h: 0.9, sizing: { type: "contain", w: 1.3, h: 0.9 }, objectName: "campus-logo" });
    s.addImage({ data: png(path.join(KIT, "brand/icons/finandex-512.png")), x: 9.0, y: 0.75, w: 1.0, h: 1.0, objectName: "app-icon" });
    constellation(s, 8.9, 2.0, 3.9, 3.9, 20, 7);
    text(s, COPY, { x: 7.2, y: 6.95, w: 5.6, h: 0.3, fontSize: 10, color: HEX.muted, align: "right" });
    s.addNotes("Presentasi UTS kelompok: Finandex — gambaran platform & tech stack. Anggota: DEA SAKA KURNIA PUTRA (261012000111), ROSSY ARTANTI ZULAIEKHA (261012000045), TAJUL TABRIZI (261012000093).");
  } else {
    s = pres.addSlide({ masterName: "FX_TITLE", sectionTitle: "Pembuka" });
    s.addText("Finandex", { placeholder: "title" });
    s.addText("Wawasan indeks pasar keuangan global — 29 chatbot berbasis data dalam satu aplikasi web, mobile, dan desktop", { placeholder: "body" });
    s.addImage({ data: png(path.join(KIT, "brand/icons/finandex-512.png")), x: 0.8, y: 0.8, w: 1.1, h: 1.1, objectName: "app-icon" });
    constellation(s, 8.4, 0.8, 4.4, 5.2, 22, 7);
    text(s, "Disusun oleh Dea Saka Kurnia Putra", { x: 0.8, y: 5.4, w: 6.5, h: 0.4, fontSize: 16, color: HEX.ink, bold: true });
    text(s, "Versi 1.0, 23 Oktober 2026", { x: 0.8, y: 5.8, w: 6.5, h: 0.35, fontSize: 13, color: HEX.muted });
    s.addImage({ data: png(path.join(KIT, "brand/dskp-wordmark-on-dark.png")), x: 0.8, y: 6.3, w: 2.6, h: 0.52, sizing: { type: "contain", w: 2.6, h: 0.52 }, objectName: "personal-wordmark" });
    text(s, COPY, { x: 7.2, y: 6.95, w: 5.6, h: 0.3, fontSize: 10, color: HEX.muted, align: "right" });
    s.addNotes("Finandex: aplikasi insights indeks pasar keuangan dengan 29 chatbot (Dex). Satu codebase untuk web/PWA, iOS, Android, macOS, dan Windows. Dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.");

  }

  // ---------------------------------------------------------------- 2. Ringkasan
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Pembuka" });
  s.addText("Satu aplikasi, 29 chatbot dengan datanya sendiri", { placeholder: "title" });
  const stats = [[String(fg.dex.length), "chatbot Dex", "masing-masing dengan menu, fitur, logo, dan dataset sendiri", HEX.phos],
                 [String(fg.app.groups.length), "kategori", "dikelompokkan berdasarkan kemiripan fungsi chatbot", HEX.ion],
                 [String(man.length), "dataset unggahan", "+ 4 dataset kit: anti-scam, katalog regulasi, alur konsultasi, panduan fitur", HEX.amber],
                 [String(ev.items.length), "pertanyaan evaluasi", "mock 100%, live ≥ 95%, item keamanan 100%", HEX.coral]];
  stats.forEach(([n, l, d, col], i) => { const x = 0.6 + i * 3.08;
    pane(s, x, 1.55, 2.86, 3.3, `stat-${i}`);
    text(s, n, { x: x + 0.3, y: 1.8, w: 2.3, h: 1.1, fontSize: 60, bold: true, color: col, fontFace: "Arial" });
    text(s, l, { x: x + 0.3, y: 2.95, w: 2.3, h: 0.45, fontSize: 18, bold: true });
    text(s, d, { x: x + 0.3, y: 3.45, w: 2.35, h: 1.2, fontSize: 14, color: HEX.muted }); });
  text(s, [{ text: "Angka hanya dari data. ", options: { bold: true, color: HEX.phos } }, { text: "Setiap angka berasal dari tool deterministik dan diuji terhadap golden fixtures. Setiap jawaban menampilkan grafik, analisis, panel \"Kenapa jawabannya begini?\", keterbatasan, dan sumber.", options: { color: HEX.ink } }],
    { x: 0.6, y: 5.2, w: 12.1, h: 1.2, fontSize: 16 });
  s.addNotes("Empat angka kunci. Prinsip utama: model bahasa tidak boleh menghitung atau mengingat angka; semua angka dari tool deterministik.");

  // ---------------------------------------------------------------- 3. Masalah
  section("Masalah & solusi");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Masalah & solusi" });
  s.addText("Masalah yang diselesaikan", { placeholder: "title" });
  const L = ag.latest;
  [[IC.data, "Data keuangan tersebar", "Harga, fundamental, makro, kripto, dan data sosial ekonomi ada di format berbeda dengan kualitas tidak seragam."],
   [IC.robot, "Jawaban AI sulit diverifikasi", "Chatbot umum menyebut angka tanpa sumber, tanggal data, atau cara menghitung."],
   [IC.shield, "Scam keuangan meningkat", `IASC menerima ${idn(L.reports_total.value)} laporan sejak 22 November 2024 hingga 30 September 2026; dana diblokir ${miliar(L.funds_blocked_idr.value)}.`],
   [IC.scale, "Literasi hukum terbatas", "Korban tidak tahu urutan langkah (bank, IASC, Laporan Polisi) dan dasar hukumnya setelah KUHP & KUHAP baru berlaku 2 Januari 2026."]]
    .forEach(([ic, h, d], i) => { const y = 1.5 + i * 1.3;
      s.addShape(pres.ShapeType.ellipse, { x: 0.6, y, w: 0.9, h: 0.9, fill: { color: HEX.pane2 }, line: { color: HEX.edge, width: 0.75 }, objectName: `p-ic-bg-${i}` });
      s.addImage({ data: ic, x: 0.8, y: y + 0.2, w: 0.5, h: 0.5, objectName: `p-ic-${i}` });
      text(s, h, { x: 1.8, y: y + 0.02, w: 10.8, h: 0.4, fontSize: 18, bold: true });
      text(s, d, { x: 1.8, y: y + 0.44, w: 10.8, h: 0.7, fontSize: 14, color: HEX.muted }); });
  s.addNotes("Sumber statistik IASC: konferensi pers OJK 5 Oktober 2026 (Kontan, Bisnis.com).");

  // ---------------------------------------------------------------- 4. Peta fitur
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Masalah & solusi" });
  s.addText("29 Dex dalam 8 kategori", { placeholder: "title" });
  fg.app.groups.forEach((g, i) => { const col = i % 4, row = Math.floor(i / 4); const x = 0.6 + col * 3.08, y = 1.45 + row * 2.75;
    pane(s, x, y, 2.86, 2.55, `grp-${g.id}`);
    text(s, g.name, { x: x + 0.22, y: y + 0.18, w: 2.45, h: 0.6, fontSize: 14, bold: true, color: HEX.phos });
    g.dex.forEach((d, k) => s.addImage({ data: DI(d), x: x + 0.22 + k * 0.5, y: y + 0.85, w: 0.42, h: 0.42, objectName: `ic-${d}` }));
    text(s, g.dex.map((d) => fg.dex.find((e) => e.id === d).name).join(", "), { x: x + 0.22, y: y + 1.4, w: 2.45, h: 1.05, fontSize: 11, color: HEX.muted }); });
  s.addNotes("Kategori: " + fg.app.groups.map((g) => `${g.name} (${g.dex.length})`).join("; ") + ".");

  // ---------------------------------------------------------------- 5. Anatomi jawaban
  section("Produk");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Produk" });
  s.addText("Setiap jawaban bisa diperiksa", { placeholder: "title" });
  const steps = [["Jawaban inti", "2–4 kalimat, angka utama + tanggal data", HEX.ion], ["Grafik visual", "dipilih tool: garis, bar, heatmap, kutipan pasal", HEX.phos],
                 ["Analisis", "3–6 butir yang merujuk angka dari tool", HEX.ion], ["Kenapa jawabannya begini?", "data, rumus, aturan pembersihan, tool dipanggil", HEX.phos],
                 ["Keterbatasan & sumber", "flag kualitas, sampel, as-of, dataset", HEX.amber], ["Disclaimer", "bukan nasihat investasi atau hukum", HEX.muted]];
  steps.forEach(([h, d, col], i) => { const x = 0.6 + (i % 3) * 4.1, y = 1.5 + Math.floor(i / 3) * 2.3;
    pane(s, x, y, 3.85, 2.05, `step-${i}`);
    text(s, String(i + 1), { x: x + 0.25, y: y + 0.2, w: 0.7, h: 0.7, fontSize: 36, bold: true, color: col, fontFace: "Arial" });
    text(s, h, { x: x + 1.0, y: y + 0.28, w: 2.7, h: 0.55, fontSize: 17, bold: true });
    text(s, d, { x: x + 1.0, y: y + 0.9, w: 2.7, h: 0.95, fontSize: 14, color: HEX.muted }); });
  text(s, [{ text: "Warna = asal-usul: ", options: { bold: true } }, { text: "hijau phosphor = data, ", options: { color: HEX.phos } }, { text: "sian = narasi AI, ", options: { color: HEX.ion } },
           { text: "krem = teks resmi, ", options: { color: HEX.paper } }, { text: "amber = keterbatasan.", options: { color: HEX.amber } }], { x: 0.6, y: 6.25, w: 12.1, h: 0.45, fontSize: 15 });
  s.addNotes("Panel justifikasi dibangkitkan dari event method milik tool, bukan dari proses berpikir internal model.");

  // ---------------------------------------------------------------- 6. Arsitektur
  section("Arsitektur & tech stack");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Arsitektur & tech stack" });
  s.addText("Arsitektur satu codebase", { placeholder: "title" });
  const box = (x, y, w, h, title, sub, name, col = HEX.ink) => { pane(s, x, y, w, h, name); text(s, title, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.4, fontSize: 15, bold: true, color: col });
    text(s, sub, { x: x + 0.2, y: y + 0.55, w: w - 0.4, h: h - 0.65, fontSize: 12, color: HEX.muted }); };
  [["Web / PWA", "React · Vite · Workbox"], ["iOS · Android", "Capacitor"], ["macOS · Windows", "Tauri 2"], ["Lovable", "preview & editor"]]
    .forEach(([t, sub], i) => box(0.6, 1.45 + i * 1.3, 2.8, 1.1, t, sub, `client-${i}`));
  box(4.15, 1.45, 4.0, 2.3, "Vercel + Netlify", "SPA statis + CDN\n/data/core · /data/heavy\n/whitepaper · /downloads", "hosting", HEX.phos);
  box(4.15, 3.95, 4.0, 2.4, "API handle(Request, env)", "/api/chat (SSE)\nOrkestrator + tool deterministik\nzod · CORS · rate limit", "api", HEX.phos);
  box(8.9, 1.45, 3.8, 2.3, "Claude API", "claude-sonnet-5-5\nclaude-haiku-5-5\nstrict tool use · caching", "claude", HEX.ion);
  box(8.9, 3.95, 3.8, 2.4, "Build data (CI)", "ETL TypeScript streaming\nGolden + paritas Python\nRegulasi resmi + SHA-256", "etl", HEX.amber);
  for (let i = 0; i < 4; i++) s.addShape(pres.ShapeType.line, { x: 3.4, y: 2.0 + i * 1.3, w: 0.75, h: 0, line: { color: HEX.phos, width: 1.5, endArrowType: "triangle" }, objectName: `arr-c${i}` });
  s.addShape(pres.ShapeType.line, { x: 8.15, y: 5.1, w: 0.75, h: 0, line: { color: HEX.ion, width: 1.5, beginArrowType: "triangle", endArrowType: "triangle" }, objectName: "arr-ai" });
  s.addShape(pres.ShapeType.line, { x: 8.15, y: 2.6, w: 0.75, h: 0, line: { color: HEX.amber, width: 1.5, beginArrowType: "triangle" }, objectName: "arr-etl" });
  s.addNotes("Server runtime-agnostik (Web Fetch API) dengan adapter Vercel & Netlify. Data dibangun di CI lalu dilayani sebagai file statis. Klien mobile & desktop memakai build web yang sama.");

  // ---------------------------------------------------------------- 7–10. Tech stack tables
  const th = (t) => ({ text: t, options: { bold: true, color: HEX.bg, fill: { color: HEX.phos }, fontSize: 13 } });
  const td = (t, b = false) => ({ text: t, options: { color: b ? HEX.ink : HEX.muted, bold: b, fontSize: 13, fill: { color: HEX.pane } } });
  const stackSlide = (title, rows, note, widths = [2.6, 4.6, 4.9]) => {
    const sl = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Arsitektur & tech stack" });
    sl.addText(title, { placeholder: "title" });
    sl.addTable([[th("Lapisan"), th("Teknologi"), th("Peran")], ...rows.map(([a, b, c]) => [td(a, true), td(b, true), td(c)])],
      { x: 0.6, y: 1.45, w: 12.1, colW: widths, border: { type: "solid", pt: 0.75, color: HEX.bg }, rowH: 0.5, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1], objectName: "stack-table" });
    sl.addNotes(note); return sl; };
  stackSlide("Tech stack: frontend", [
    ["UI & bahasa", "React 18+, TypeScript strict", "Komponen & tipe ketat di seluruh kode"], ["Build", "Vite", "Code splitting, lazy load halaman Dex"],
    ["Styling", "Tailwind CSS + shadcn/ui (Radix)", "Token desain Index Constellation, primitif aksesibel"], ["Routing & data", "React Router, TanStack Query, Zustand, zod", "Deep link, cache, state UI, validasi"],
    ["Grafik & tabel", "Apache ECharts + LTTB, TanStack Table/Virtual", "Grafik interaktif, tabel besar tervirtualisasi"], ["Cari & teks", "MiniSearch, react-markdown + rehype-sanitize, pdfjs-dist", "BM25 entitas & pasal, chat aman, pratinjau PDF"],
    ["Kinerja & offline", "Web Worker + Comlink, vite-plugin-pwa (Workbox), IndexedDB", "UI tidak membeku, PWA offline"], ["i18n & font", "i18next; Unbounded, IBM Plex Sans/Serif (OFL)", "Bahasa Indonesia & English, tipografi khas"]],
    "Satu paket npm di root repo agar kompatibel dengan Lovable.");
  stackSlide("Tech stack: backend, API & AI", [
    ["Handler", "handle(Request, env) di Web Fetch API", "Runtime-agnostik"], ["Adapter", "Vercel Functions, Netlify Functions (/api/*)", "Satu kode server untuk dua platform"],
    ["Streaming", "Server-Sent Events", "meta, status, text, artifact, method, citation, done, error"], ["Data", "DataStore: fetch + LRU + ETag", "JSON & matriks Float32 dari CDN"],
    ["Keamanan", "zod, CORS allowlist, CSP, HSTS, rate limit (Upstash Redis)", "Validasi, pembatasan, tanpa secret di klien"], ["SDK AI", "@anthropic-ai/sdk (Claude API)", "Streaming, strict tool use, prompt caching"],
    ["Model", "claude-sonnet-5-5 · claude-haiku-5-5", "Jawaban · judul & ringkasan riwayat"], ["Batas", "8 giliran, 12 tool, 50 detik", "Sesuai batas fungsi 60 detik"]],
    "Tidak mengirim temperature/top_p/top_k. Tool hanya baca data, tanpa URL dari pengguna.");
  stackSlide("Tech stack: data, ETL & verifikasi", [
    ["ETL", "TypeScript streaming (CSV, ZIP, Parquet JS)", "public/data/core & heavy"], ["Format", "JSON kolumnar + kamus, matriks Float32", "Ringkas & cepat"],
    ["Input", `GitHub Release data-inputs-v1 (${man.length} file)`, "Diverifikasi SHA-256"], ["Regulasi", `Katalog ${lc.documents} dokumen → lock file → Release data-regulations-v1`, "Hanya domain resmi; verifikasi judul & jangkar"],
    ["Dataset kit", "AntiScam KB, katalog regulasi, alur konsultasi, panduan fitur", "Validator + golden"], ["Referensi", "Python 3.12, pandas, numpy, pyarrow, poppler", "Golden fixtures"],
    ["Paritas", "GitHub Actions parity.yml", "Python = golden = TypeScript"], ["Evaluasi", `${ev.items.length} item chatbot`, "Mock 100%, live ≥ 95%, keamanan 100%"]],
    "Toleransi golden relatif 1e-6; tanggal, string, dan flag harus sama persis.");
  stackSlide("Tech stack: mobile, desktop, DevOps & mutu", [
    ["Mobile", "Capacitor (iOS & Android) + plugin resmi", "Haptik, share, offline, in-app browser"], ["Desktop", "Tauri 2 (macOS .dmg universal, Windows .exe/.msi)", "Codesign, notarisasi, updater bertanda tangan"],
    ["Repo & rilis", "GitHub: main → CI → release", "Fast-forward otomatis saat CI hijau"], ["Hosting", "Vercel, Netlify, Lovable", "Produksi, mirror, preview & editor"],
    ["CI/CD", "ci, parity, promote, android, ios, desktop, regulations, ui-review, eval-live", "GitHub Actions"], ["Uji", "Vitest, Playwright (3 browser), axe, Lighthouse CI, size-limit", "Coverage ≥ 90%, a11y, performa"],
    ["UI/UX", "Regresi visual, audit token, uji tugas pengguna", "Desain unik & konsisten"], ["Keamanan rantai", "gitleaks, npm audit, license-checker, SBOM", "Tanpa secret, tanpa GPL/AGPL/SSPL"]],
    "Semua gate dijalankan oleh npm run verify sebelum rilis.");

  // ---------------------------------------------------------------- 11. Pasang di mana saja
  section("Platform & desain");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Platform & desain" });
  s.addText("Pasang di semua perangkat", { placeholder: "title" });
  [[IC.phone, "iPhone & iPad", "Panduan \"Tambahkan ke Layar Utama\" di Safari; App Store/TestFlight saat tersedia"],
   [IC.tablet, "Android", "Tombol pasang PWA otomatis; Google Play saat tersedia; opsi APK bertanda tangan"],
   [IC.laptop, "macOS", "Unduh .dmg universal (Apple silicon & Intel), bertanda tangan & ter-notarisasi"],
   [IC.desktop, "Windows", "Unduh installer .exe/.msi (x64 & ARM64) bertanda tangan; atau PWA di Edge"]]
    .forEach(([ic, h, d], i) => { const x = 0.6 + i * 3.08; pane(s, x, 1.5, 2.86, 3.6, `inst-${i}`);
      s.addImage({ data: ic, x: x + 0.3, y: 1.8, w: 0.7, h: 0.7, objectName: `inst-ic-${i}` });
      text(s, h, { x: x + 0.3, y: 2.7, w: 2.3, h: 0.45, fontSize: 18, bold: true });
      text(s, d, { x: x + 0.3, y: 3.2, w: 2.35, h: 1.8, fontSize: 14, color: HEX.muted }); });
  text(s, "Beranda dan halaman /install mengenali perangkat dan menampilkan satu tombol yang tepat, lengkap dengan versi, ukuran, dan SHA-256; desktop menampilkan kode QR untuk ponsel. My LAIwyer dan FinLAIwyer juga bisa dipasang sebagai aplikasi terpisah.",
    { x: 0.6, y: 5.35, w: 12.1, h: 1.1, fontSize: 15 });
  s.addNotes("Pusat pemasangan memakai feature detection & User-Agent Client Hints, tanpa fingerprinting.");

  // ---------------------------------------------------------------- 12. Desain
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Platform & desain" });
  s.addText("Sistem desain Index Constellation", { placeholder: "title" });
  constellation(s, 0.7, 1.5, 5.0, 4.6, 26, 11);
  text(s, "Konstelasi Indeks di Beranda: satu inti (Finandex AI) dan 29 node Dex; terang node = kesegaran data, cincin = status.", { x: 0.6, y: 6.15, w: 5.4, h: 0.7, fontSize: 13, color: HEX.muted });
  [["phosphor", HEX.phos, "angka dari dataset"], ["ion", HEX.ion, "narasi AI"], ["paper", HEX.paper, "kutipan teks resmi"], ["amber", HEX.amber, "keterbatasan & flag"], ["coral", HEX.coral, "negatif & bahaya"]]
    .forEach(([n, col, d], i) => { const y = 1.55 + i * 0.75; s.addShape(pres.ShapeType.roundRect, { x: 6.5, y, w: 0.55, h: 0.55, rectRadius: 0.1, fill: { color: col }, line: { color: col, width: 0 }, objectName: `sw-${n}` });
      text(s, [{ text: n + "  ", options: { bold: true } }, { text: d, options: { color: HEX.muted } }], { x: 7.25, y: y + 0.08, w: 5.4, h: 0.4, fontSize: 16 }); });
  text(s, "Tipografi: Unbounded untuk judul, IBM Plex Sans untuk UI dan angka tabular, IBM Plex Serif untuk kutipan resmi. Interaksi: Index Search, Orbit Rail, Evidence Pane, Baki Banding, Konsultasi Terpandu.", { x: 6.5, y: 5.45, w: 6.2, h: 1.2, fontSize: 14 });
  s.addNotes("Desain diuji dengan prompt UIUX_TEST_PROMPT.md: audit token, regresi visual, a11y, performa gerak, dan tinjauan berskor.");

  // ---------------------------------------------------------------- 13. Hukum
  section("Hukum & anti-scam");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Hukum & anti-scam" });
  s.addText("My LAIwyer dan FinLAIwyer", { placeholder: "title" });
  [["mylaiwyer", "My LAIwyer — hukum umum", `${lc.by_corpus.umum} dokumen: UUD 1945, KUHP baru, KUHAP 1981 & 2025, UU 1/2026, KUHPerdata, bantuan hukum, gugatan sederhana`, `${flows.by_dex.mylaiwyer} alur terpandu: diperiksa polisi, gugatan ganti rugi, hierarki peraturan`],
   ["finlaiwyer", "FinLAIwyer — keuangan & perbankan", `${lc.by_corpus.keuangan} dokumen: UU P2SK, OJK, Perbankan, BI, Transfer Dana, TPPU, PDP, ITE, POJK 22/2023, PBI 6/2026, dan lainnya`, `${flows.by_dex.finlaiwyer} alur terpandu: baru tertipu, uang nyasar, teror pinjol, investasi bodong, transaksi tidak sah`]]
    .forEach(([id, h, d1, d2], i) => { const x = 0.6 + i * 6.15; pane(s, x, 1.5, 5.95, 3.9, `law-${id}`);
      s.addImage({ data: DI(id), x: x + 0.3, y: 1.8, w: 0.8, h: 0.8, objectName: `law-ic-${id}` });
      text(s, h, { x: x + 1.3, y: 1.95, w: 4.4, h: 0.5, fontSize: 18, bold: true });
      text(s, d1, { x: x + 0.3, y: 2.85, w: 5.4, h: 1.3, fontSize: 14, color: HEX.muted });
      text(s, d2, { x: x + 0.3, y: 4.2, w: 5.4, h: 1.0, fontSize: 14, color: HEX.ion }); });
  text(s, [{ text: "Kutipan hanya dari teks resmi terverifikasi. ", options: { bold: true, color: HEX.paper } }, { text: "Status dokumen selalu disebut; ancaman pidana UU sektoral dibaca bersama UU 1/2026. Informasi hukum, bukan nasihat hukum.", options: { color: HEX.ink } }],
    { x: 0.6, y: 5.65, w: 12.1, h: 0.9, fontSize: 15 });
  s.addNotes("Keduanya Dex terpisah dengan dataset, menu, logo, dan riwayat sendiri; juga tersedia sebagai PWA terpisah.");

  // ---------------------------------------------------------------- 14. AntiScamDex + charts
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Hukum & anti-scam" });
  s.addText("AntiScamDex: data penanganan scam", { placeholder: "title" });
  const ser = ag.series_reports_total.filter((o) => !o.headline_only);
  const fmtD = (d) => { const [y, m, dd] = d.split("-"); return `${+dd} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"][+m - 1]} ${y.slice(2)}`; };
  s.addChart(pres.ChartType.line, [{ name: "Laporan kumulatif", labels: ser.map((o) => fmtD(o.cutoff)), values: ser.map((o) => o.value) }],
    { x: 0.6, y: 1.45, w: 6.1, h: 3.9, chartColors: [HEX.phos], lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 8, showValue: true, dataLabelPosition: "t", dataLabelFormatCode: "#,##0",
      dataLabelColor: HEX.ink, dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt", catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
      catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, valGridLine: { color: HEX.edge, size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, showTitle: true, title: "Laporan ke IASC (kumulatif)",
      titleColor: HEX.ink, titleFontFace: "+mn-lt", titleFontSize: 13, valAxisLabelFormatCode: "#,##0", objectName: "chart-reports" });
  const both = ["2026-05-31", "2026-07-31", "2026-09-30"];
  const kbj = J("datasets/antiscam/antiscam_kb.json");
  const val = (m, d) => (kbj.stats.find((o) => o.metric === m && o.cutoff === d && o.cutoff_precision === "day") || {}).value / 1e9;
  s.addChart(pres.ChartType.bar, [{ name: "Dana diblokir", labels: both.map(fmtD), values: both.map((d) => val("funds_blocked_idr", d)) }, { name: "Dana dikembalikan", labels: both.map(fmtD), values: both.map((d) => val("funds_returned_idr", d)) }],
    { x: 6.95, y: 1.45, w: 5.75, h: 3.9, barDir: "col", barGrouping: "clustered", chartColors: [HEX.amber, HEX.phos], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0.0",
      dataLabelColor: HEX.ink, dataLabelFontSize: 10, dataLabelFontFace: "+mn-lt", catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
      catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, valGridLine: { color: HEX.edge, size: 0.5 }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendColor: HEX.muted, legendFontFace: "+mn-lt", legendFontSize: 11,
      showTitle: true, title: "Dana korban (Rp miliar)", titleColor: HEX.ink, titleFontFace: "+mn-lt", titleFontSize: 13, objectName: "chart-funds" });
  text(s, `Per 30 Sep 2026: ${idn(L.accounts_blocked.value)} rekening diblokir (${idn(ag.blocked_share_of_reported.at(-1).share * 100, 2)}% dari yang dilaporkan); dana dikembalikan ${idn(ag.returned_share_of_blocked.at(-1).share * 100, 2)}% dari dana diblokir. Fitur: Baru kena scam, Siapkan Laporan (offline), Statistik, Kenali Modus, Kanal Resmi.`,
    { x: 0.6, y: 5.55, w: 12.1, h: 0.75, fontSize: 14 });
  text(s, "Sumber: siaran pers OJK/Satgas PASTI (SP 15/GKPB/OJK/I/2026, SP 16/STPASTI/VIII/2026), Kontan & Bisnis.com 6 Okt 2026. Finandex tidak berafiliasi dengan IASC/OJK.", { x: 0.6, y: 6.38, w: 12.1, h: 0.45, fontSize: 10, color: HEX.muted });
  s.addNotes("Grafik hanya memakai titik bertanggal pasti dari siaran pers/berita lengkap; titik yang hanya berasal dari judul berita tidak digambar di sini.");

  // ---------------------------------------------------------------- 15. Keamanan
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Hukum & anti-scam" });
  s.addText("Keamanan dan privasi", { placeholder: "title" });
  [[IC.lock, "Secret hanya di server", "Bundel klien dipindai pola kunci; CSP ketat, CORS allowlist, rate limit"],
   [IC.key, "Data sensitif diblokir", "Seed phrase, private key, kartu, NIK, OTP/PIN, dan nomor rekening dicegah sebelum terkirim"],
   [IC.eye, "Tanpa akun & tanpa pelacakan", "Riwayat chat, watchlist, dan isian Siapkan Laporan hanya di perangkat (terenkripsi)"],
   [IC.warn, "Tidak meniru lembaga resmi", "Tanpa logo OJK/BI/IASC; tidak ada formulir laporan atas nama lembaga"],
   [IC.check, "Isi dataset = data", "Teks dataset tidak pernah menjadi instruksi; eval memuat kasus prompt injection"]]
    .forEach(([ic, h, d], i) => { const y = 1.45 + i * 1.07;
      s.addImage({ data: ic, x: 0.7, y: y + 0.12, w: 0.5, h: 0.5, objectName: `sec-ic-${i}` });
      text(s, h, { x: 1.5, y: y + 0.05, w: 11.0, h: 0.4, fontSize: 17, bold: true });
      text(s, d, { x: 1.5, y: y + 0.47, w: 11.0, h: 0.45, fontSize: 14, color: HEX.muted }); });
  s.addNotes("Kebijakan privasi mengacu UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.");

  // ---------------------------------------------------------------- 16. Deploy
  section("Rilis & dokumen");
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Rilis & dokumen" });
  s.addText("Dari commit sampai aplikasi terpasang", { placeholder: "title" });
  const flow = [["GitHub main", "Claude Code & Lovable"], ["CI: npm run verify", "lint · test · golden · eval · E2E · a11y"], ["Preview", "Vercel · Netlify · Lovable"],
                ["release", "fast-forward saat hijau"], ["Distribusi", "Web/PWA · App Store · Play · .dmg · .exe"]];
  flow.forEach(([h, d], i) => { const x = 0.6 + i * 2.48; pane(s, x, 2.3, 2.2, 2.2, `flow-${i}`);
    text(s, String(i + 1), { x: x + 0.2, y: 2.45, w: 0.6, h: 0.6, fontSize: 28, bold: true, color: HEX.phos, fontFace: "Arial" });
    text(s, h, { x: x + 0.2, y: 3.1, w: 1.85, h: 0.45, fontSize: 15, bold: true });
    text(s, d, { x: x + 0.2, y: 3.55, w: 1.85, h: 0.85, fontSize: 12, color: HEX.muted });
    if (i < flow.length - 1) s.addShape(pres.ShapeType.line, { x: x + 2.2, y: 3.4, w: 0.28, h: 0, line: { color: HEX.phos, width: 1.5, endArrowType: "triangle" }, objectName: `flow-arr-${i}` }); });
  text(s, "Rollback: Vercel Instant Rollback atau publish ulang deploy Netlify sebelumnya. Data input & dokumen regulasi disimpan di GitHub Releases dengan checksum.", { x: 0.6, y: 5.0, w: 12.1, h: 0.8, fontSize: 15 });
  s.addNotes("Production branch Vercel & Netlify = release. Workflow desktop.yml membangun macOS & Windows; android.yml & ios.yml membangun aplikasi store.");

  // ---------------------------------------------------------------- 17. Whitepaper
  s = pres.addSlide({ masterName: "FX_CONTENT", sectionTitle: "Rilis & dokumen" });
  s.addText("Whitepaper Finandex", { placeholder: "title" });
  const pid = pages("Finandex_Whitepaper_ID.pdf"), pen = pages("Finandex_Whitepaper_EN.pdf");
  s.addImage({ path: path.join(WP, "assets/cover_id.png"), x: 0.6, y: 1.45, w: 2.55, h: 3.62, objectName: "wp-cover-id" });
  s.addImage({ path: path.join(WP, "assets/cover_en.png"), x: 3.35, y: 1.45, w: 2.55, h: 3.62, objectName: "wp-cover-en" });
  text(s, `Bahasa Indonesia${pid ? ` (${pid} halaman)` : ""}`, { x: 0.6, y: 5.15, w: 2.55, h: 0.35, fontSize: 12, color: HEX.muted, align: "center" });
  text(s, `English${pen ? ` (${pen} pages)` : ""}`, { x: 3.35, y: 5.15, w: 2.55, h: 0.35, fontSize: 12, color: HEX.muted, align: "center" });
  text(s, "Isi whitepaper", { x: 6.4, y: 1.45, w: 6.3, h: 0.45, fontSize: 18, bold: true, color: HEX.phos });
  text(s, ["Ringkasan eksekutif, masalah, visi & prinsip", "Peta 29 Dex dalam 8 kategori + katalog fungsi per Dex", "Data, pembersihan, golden fixtures & paritas",
           "Mesin chatbot & format jawaban", "My LAIwyer, FinLAIwyer & AntiScamDex", "Tech stack lengkap: frontend, backend, AI, data, mobile, desktop, DevOps, QA, keamanan",
           "Sistem desain, kepatuhan, batasan, peta jalan"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })),
    { x: 6.4, y: 2.0, w: 6.3, h: 3.3, fontSize: 14, paraSpaceAfter: 6 });
  pane(s, 6.4, 5.45, 6.3, 1.0, "wp-download");
  s.addImage({ data: IC.file, x: 6.6, y: 5.65, w: 0.6, h: 0.6, objectName: "wp-ic" });
  text(s, [{ text: "Unduh di aplikasi: ", options: { bold: true } }, { text: "halaman /whitepaper — PDF Bahasa Indonesia & English, plus presentasi ini (.pptx). Tersedia offline.", options: { color: HEX.muted } }],
    { x: 7.4, y: 5.62, w: 5.1, h: 0.7, fontSize: 13 });
  s.addNotes("Whitepaper dibangun ulang dengan kit/whitepaper/build_whitepaper.py; setiap file punya SHA-256 di whitepaper_manifest.json.");

  // ---------------------------------------------------------------- 18. Penutup
  s = pres.addSlide({ masterName: "FX_TITLE", sectionTitle: "Rilis & dokumen" });
  s.addText("Langkah berikutnya", { placeholder: "title" });
  s.addText("Bangun dengan Master Prompt v3 di Claude Code, unggah dokumen hukum yang masih menunggu, siapkan akun store & sertifikat tanda tangan, lalu rilis.", { placeholder: "body" });
  constellation(s, 8.4, 0.9, 4.4, 5.0, 20, 3);
  text(s, "Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra — A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK", { x: 0.8, y: 5.6, w: 7.2, h: 0.7, fontSize: 14, color: HEX.muted });
  s.addImage({ data: png(path.join(KIT, "brand/dskp-mark-on-dark.png")), x: 0.8, y: 6.35, w: 0.5, h: 0.5, sizing: { type: "contain", w: 0.5, h: 0.5 }, objectName: "personal-mark" });
  text(s, COPY, { x: 1.45, y: 6.45, w: 6.5, h: 0.3, fontSize: 10, color: HEX.muted });
  if (UTS) text(s, "UTS · Kelompok: DEA SAKA KURNIA PUTRA, ROSSY ARTANTI ZULAIEKHA, TAJUL TABRIZI", { x: 0.8, y: 5.05, w: 7.2, h: 0.4, fontSize: 12, color: HEX.muted, objectName: "uts-group-line" });
  s.addNotes("Template ADD_NEW_DEX_PROMPT.md untuk fitur baru; UPDATE_V3_PROMPT.md untuk repo yang sudah dibangun dari v2.");

  const out = path.join(WP, UTS ? "Finandex_UTS_Kelompok.pptx" : "Finandex_Platform_Overview.pptx");
  await pres.writeFile({ fileName: out });
  const themeMod = ARGS[1] || "/mnt/skills/public/pptx/scripts/apply_theme.js";
  if (fs.existsSync(themeMod)) { const { applyTheme } = require(themeMod); await applyTheme(out, THEME); }
  console.log("ok", out);
})().catch((e) => { console.error(e); process.exit(1); });
