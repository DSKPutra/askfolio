#!/usr/bin/env python3
# © 2026 Dea Saka Kurnia Putra. All rights reserved.
"""Build the Finandex whitepaper PDFs (Bahasa Indonesia & English) from FINANDEX_WHITEPAPER_{ID,EN}.md.

Requires: Python 3.12, `markdown`, `playwright` (Chromium). Fonts (OFL) are in ./fonts, diagrams in ./assets,
brand files in ../brand. Writes Finandex_Whitepaper_{ID,EN}.pdf and whitepaper_manifest.json (SHA-256 of every
downloadable file, including Finandex_Platform_Overview.pptx when present).
Usage: python3 -I kit/whitepaper/build_whitepaper.py kit/whitepaper
"""
import asyncio, hashlib, json, os, re, sys
import markdown

HERE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(__file__))
BRAND = os.path.abspath(os.path.join(HERE, "..", "brand"))
COPY = {"id": "© 2026 Dea Saka Kurnia Putra. Hak cipta dilindungi undang-undang.", "en": "© 2026 Dea Saka Kurnia Putra. All rights reserved."}
LABEL = {"id": dict(by="Disusun oleh", ver="Versi", page="Halaman", toc="Daftar isi"), "en": dict(by="Prepared by", ver="Version", page="Page", toc="Contents")}

CSS = """
@font-face{font-family:Unbounded;src:url(fonts/unbounded-latin-400-normal.woff2);font-weight:400}
@font-face{font-family:Unbounded;src:url(fonts/unbounded-latin-600-normal.woff2);font-weight:600}
@font-face{font-family:'IBM Plex Sans';src:url(fonts/ibm-plex-sans-latin-400-normal.woff2);font-weight:400}
@font-face{font-family:'IBM Plex Sans';src:url(fonts/ibm-plex-sans-latin-400-italic.woff2);font-weight:400;font-style:italic}
@font-face{font-family:'IBM Plex Sans';src:url(fonts/ibm-plex-sans-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:'IBM Plex Sans';src:url(fonts/ibm-plex-sans-latin-600-normal.woff2);font-weight:600}
@font-face{font-family:'IBM Plex Serif';src:url(fonts/ibm-plex-serif-latin-400-normal.woff2);font-weight:400}
:root{--ink:#06140C;--muted:#3E5547;--edge:rgba(4,24,12,.14);--phos:#087A25;--pane:#EBF1EC;--paper:#FBF6E8}
@page{size:A4;margin:20mm 18mm 20mm 18mm}
html{font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--ink);font-size:10.4pt;line-height:1.55;font-variant-numeric:tabular-nums}
body{margin:0}
h1,h2,h3,h4{font-family:Unbounded,'IBM Plex Sans',sans-serif;font-weight:600;line-height:1.2;color:var(--ink);break-after:avoid}
h2{font-size:17pt;margin:26pt 0 8pt;padding-top:6pt;border-top:1px solid var(--edge)}
h3{font-size:12.5pt;margin:18pt 0 6pt}
h4{font-size:10.8pt;margin:14pt 0 4pt;color:var(--phos)}
p,li,td,th{overflow-wrap:anywhere;word-break:break-word}
p,li{max-width:165mm}
a{color:var(--phos);text-decoration:none;word-break:break-all}
code{font-family:'IBM Plex Sans',monospace;background:var(--pane);padding:0 3px;border-radius:4px;font-size:.92em;white-space:normal;word-break:break-all}
table{border-collapse:collapse;width:100%;margin:8pt 0 12pt;font-size:9pt;break-inside:auto}
th,td{border-bottom:1px solid var(--edge);padding:5pt 6pt;text-align:left;vertical-align:top}
th{font-weight:600;background:var(--pane)}
tr{break-inside:avoid}
td:first-child,th:first-child{overflow-wrap:normal;word-break:normal;min-width:24mm}
blockquote{margin:12pt 0;padding:10pt 14pt;background:var(--paper);border-radius:12px;font-family:'IBM Plex Serif',serif;font-size:10pt}
blockquote p{margin:0}
.figure{margin:14pt 0;break-inside:avoid}
.figure img{width:100%;border-radius:14px}
.caption{font-size:8.8pt;color:var(--muted);margin-top:4pt}
hr{border:0;border-top:1px solid var(--edge);margin:18pt 0}
.cover{page-break-after:always;height:252mm;position:relative;background:#07130D;color:#E9F5EC;border-radius:20px;overflow:hidden;padding:24mm 18mm;box-sizing:border-box}
.cover .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(201,255,214,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(201,255,214,.05) 1px,transparent 1px);background-size:12mm 12mm}
.cover svg.sky{position:absolute;right:-8mm;top:16mm;width:150mm;height:120mm}
.cover .icon{width:26mm;height:26mm;border-radius:6mm;position:relative}
.cover h1{color:#E9F5EC;font-size:40pt;margin:14mm 0 4mm;letter-spacing:.01em;position:relative;border:0}
.cover .sub{font-size:14pt;line-height:1.4;max-width:120mm;color:#CFE6D6;position:relative}
.cover .meta{position:absolute;left:18mm;bottom:22mm;right:18mm;font-size:10pt;color:#93AE9D}
.cover .meta b{color:#E9F5EC}
.cover .mark{height:13mm;margin-top:5mm}
.toc{page-break-after:always}
.toc h2{border:0}
.toc ol{padding-left:16pt}
.toc li{margin:3pt 0}
"""


def sky_svg():
    # deterministic constellation motif (same idea as the in-app hero)
    import random
    rnd = random.Random(2026)
    pts = [(rnd.uniform(10, 290), rnd.uniform(10, 230)) for _ in range(29)]
    core = (165, 118)
    lines = "".join(f'<line x1="{core[0]}" y1="{core[1]}" x2="{x:.1f}" y2="{y:.1f}" stroke="#19F23A" stroke-opacity=".16" stroke-width=".6"/>' for x, y in pts[::3])
    lines += "".join(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#3FD9FF" stroke-opacity=".18" stroke-width=".5"/>' for a, b in zip(pts, pts[1:]) if abs(a[0] - b[0]) + abs(a[1] - b[1]) < 90)
    dots = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{2.2 if i % 4 else 3.4}" fill="#19F23A" fill-opacity="{.45 if i % 4 else .9}"/>' for i, (x, y) in enumerate(pts))
    return f'<svg class="sky" viewBox="0 0 300 240">{lines}{dots}<circle cx="{core[0]}" cy="{core[1]}" r="7" fill="none" stroke="#19F23A" stroke-width="1.4"/><circle cx="{core[0]}" cy="{core[1]}" r="2.6" fill="#E9F5EC"/></svg>'


def build_html(lang):
    md = open(os.path.join(HERE, f"FINANDEX_WHITEPAPER_{lang.upper()}.md"), encoding="utf-8").read()
    fm = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    meta = dict(re.findall(r'^(\w+):\s*"?(.*?)"?$', fm.group(1), re.M)) if fm else {}
    body_md = md[fm.end():] if fm else md
    # first H1 + H2 + byline become the cover
    h1 = re.search(r"^# (.+)$", body_md, re.M).group(1)
    sub = re.search(r"^## (.+)$", body_md, re.M).group(1)
    body_md = body_md.replace(f"# {h1}\n", "", 1).replace(f"## {sub}\n", "", 1)
    body_md = re.sub(r"^(Versi|Version) 1\.0 · .*\n", "", body_md, count=1, flags=re.M)
    html = markdown.markdown(body_md, extensions=["tables", "fenced_code", "sane_lists"])
    heads = re.findall(r"<h2>(.+?)</h2>", html)
    ids = []
    for i, h in enumerate(heads):
        hid = f"s{i}"
        html = html.replace(f"<h2>{h}</h2>", f'<h2 id="{hid}">{h}</h2>', 1)
        ids.append((hid, h))
    toc = "".join(f'<li><a href="#{i}">{re.sub("<.*?>", "", h)}</a></li>' for i, h in ids)
    L = LABEL[lang]
    cover = f'''<section class="cover"><div class="grid"></div>{sky_svg()}
      <img class="icon" src="../brand/icons/finandex-512.png" alt="Finandex"/>
      <h1>{h1}</h1><div class="sub">{sub}</div>
      <div class="meta"><div>{L["ver"]} {meta.get("version", "1.0")} · {meta.get("date", "")}</div>
      <div style="margin-top:3mm">{L["by"]} <b>Dea Saka Kurnia Putra</b></div>
      <img class="mark" src="../brand/dskp-wordmark-on-dark.png" alt="Dea Saka Kurnia Putra"/>
      <div style="margin-top:4mm">{COPY[lang]}</div></div></section>'''
    tocsec = f'<section class="toc"><h2>{L["toc"]}</h2><ol>{toc}</ol></section>'
    return f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>Finandex Whitepaper ({lang.upper()})</title><style>{CSS}</style></head><body>{cover}{tocsec}{html}</body></html>'


async def render():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        for lang in ("id", "en"):
            path = os.path.join(HERE, f"_build_{lang}.html")
            open(path, "w", encoding="utf-8").write(build_html(lang))
            await pg.goto("file://" + path)
            await pg.wait_for_load_state("networkidle")
            await pg.evaluate("document.fonts.ready")
            foot = f'<div style="font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#3E5547;width:100%;padding:0 18mm;display:flex;justify-content:space-between"><span>Finandex Whitepaper · {COPY[lang]}</span><span>{LABEL[lang]["page"]} <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>'
            await pg.pdf(path=os.path.join(HERE, f"Finandex_Whitepaper_{lang.upper()}.pdf"), format="A4", print_background=True, display_header_footer=True,
                         header_template="<span></span>", footer_template=foot, prefer_css_page_size=True)
            await pg.set_viewport_size({"width": 900, "height": 1300})
            await pg.emulate_media(media="screen")
            await pg.locator(".cover").screenshot(path=os.path.join(HERE, "assets", f"cover_{lang}.png"))
            await pg.emulate_media(media="print")
            os.remove(path)
        await b.close()

asyncio.run(render())
files = [f for f in ("Finandex_Whitepaper_ID.pdf", "Finandex_Whitepaper_EN.pdf", "Finandex_Platform_Overview.pptx", "FINANDEX_WHITEPAPER_ID.md", "FINANDEX_WHITEPAPER_EN.md") if os.path.exists(os.path.join(HERE, f))]
man = dict(version="1.0", date="2026-10-23", author="Dea Saka Kurnia Putra", copyright=COPY["en"],
           files=[dict(file=f, bytes=os.path.getsize(os.path.join(HERE, f)), sha256=hashlib.sha256(open(os.path.join(HERE, f), "rb").read()).hexdigest(),
                       lang=("id" if "_ID" in f else "en" if "_EN" in f else "id"), kind=f.rsplit(".", 1)[1]) for f in files])
json.dump(man, open(os.path.join(HERE, "whitepaper_manifest.json"), "w"), indent=1)
print("ok", [(f["file"], f["bytes"]) for f in man["files"]])
