#!/usr/bin/env python3
# © 2026 Dea Saka Kurnia Putra. All rights reserved.
"""Reference implementation + validator for the kit-authored knowledge datasets:
  kit/datasets/antiscam/antiscam_kb.json      -> AntiScamDex       -> golden/antiscam/golden.json
  kit/datasets/law/regulation_catalog.json    -> My LAIwyer + FinLAIwyer -> golden/law_catalog/golden.json
  kit/datasets/law/legal_qa_flows.json        -> Konsultasi Terpandu      -> golden/legal_flows/golden.json
The TypeScript ETL (scripts/data/build-antiscam.ts, build-law-catalog.ts) must reproduce these golden files exactly and enforce the same checks.
Usage: python3 -I finandex_reference_kb.py --antiscam <json> --catalog <json> --flows <json> --out <golden_dir>
"""
import argparse, json, os, re
from urllib.parse import urlparse

ap = argparse.ArgumentParser()
ap.add_argument("--antiscam", required=True); ap.add_argument("--catalog", required=True); ap.add_argument("--flows", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
kb, cat, fl = (json.load(open(p, encoding="utf-8")) for p in (a.antiscam, a.catalog, a.flows))
ERR = []


def check(c, m):
    if not c: ERR.append(m)


DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$"); MONTH = re.compile(r"^\d{4}-\d{2}$")
OFFICIAL_DOMAINS = {"ojk.go.id", "www.ojk.go.id", "iasc.ojk.go.id", "bi.go.id", "www.bi.go.id"}
CUMULATIVE = {"reports_total", "accounts_reported", "accounts_blocked", "funds_blocked_idr", "funds_returned_idr", "losses_reported_idr"}
DEX_IDS = {"antiscamdex", "finlaiwyer", "mylaiwyer", "cryptdex", "fintechdex", "personalfinandex"}

# ------------------------------------------------------------------ AntiScam KB
src = {s["id"]: s for s in kb["sources"]}
check(len(src) == len(kb["sources"]), "duplicate source id")
for s in kb["sources"]:
    u = urlparse(s["url"])
    check(u.scheme == "https" and u.netloc, f"source url not https: {s['id']}")
    check(s["kind"] in {"official", "media", "media-headline"}, f"bad kind {s['id']}")
    check(s["kind"] != "official" or u.netloc in OFFICIAL_DOMAINS, f"official source outside official domains: {s['id']}")
    check(s["published"] is None or DATE.match(s["published"]), f"bad published {s['id']}")
    check(DATE.match(s["accessed"]) is not None, f"bad accessed {s['id']}")


def refs(obj, path="kb"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "source_ids":
                for i in v: check(i in src, f"unknown source {i} at {path}")
            else: refs(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj): refs(v, f"{path}[{i}]")


refs({k: v for k, v in kb.items() if k != "sources"})
inst = {i["id"] for i in kb["institutions"]}
chan = {c["id"]: c for c in kb["channels"]}
for c in kb["channels"]:
    check(c["operator"] is None or c["operator"] in inst, f"channel operator {c['id']}")
    if "url" in c: check(urlparse(c["url"]).scheme == "https", f"channel url {c['id']}")
labels = kb["metric_labels"]
by_metric = {}
for o in kb["stats"]:
    check(o["metric"] in labels, f"metric without label {o['metric']}")
    check(isinstance(o["value"], int) and o["value"] >= 0, f"value not non-negative int {o}")
    check((o["cutoff_precision"] == "day" and DATE.match(o["cutoff"])) or (o["cutoff_precision"] == "month" and MONTH.match(o["cutoff"])), f"cutoff/precision {o}")
    check(len(o["source_ids"]) >= 1, f"observation without source {o}")
    by_metric.setdefault(o["metric"], []).append(o)
series = {}
for m, obs in by_metric.items():
    day = sorted((o for o in obs if o["cutoff_precision"] == "day"), key=lambda o: o["cutoff"])
    check(len({o["cutoff"] for o in day}) == len(day), f"duplicate cutoff in {m}")
    if m in CUMULATIVE:
        for x, y in zip(day, day[1:]):
            check(y["value"] >= x["value"], f"cumulative metric decreases {m} {x['cutoff']}→{y['cutoff']}")
    series[m] = [dict(cutoff=o["cutoff"], value=o["value"], headline_only=all(src[s]["kind"] == "media-headline" for s in o["source_ids"]), source_ids=o["source_ids"]) for o in day]
latest = {m: s[-1] for m, s in series.items() if s}
at = lambda m, d: next((o["value"] for o in series.get(m, []) if o["cutoff"] == d), None)
L = latest["reports_total"]["cutoff"]
check(at("reports_via_pujk", L) + at("reports_direct", L) == at("reports_total", L), "via_pujk + direct != total at latest cutoff")
for s_ in kb["satgas_pasti_stats"]:
    check(sum(s_["breakdown"].values()) == s_["total"], f"satgas breakdown sum {s_['metric']} {s_['cutoff']}")
oc = kb["ojk_consumer_stats"]["service_requests"]
check(sum(oc["complaints_by_sector"].values()) == oc["complaints"], "ojk complaints by sector sum")
for r in kb["region_stats"]["regions"]:
    check(sum(c["reports"] for c in r["children"]) <= r["reports"], f"region children exceed parent {r['region']}")
modus_ids = {m["id"] for m in kb["modus"]}
for ms in kb["modus_stats"]:
    check(ms["modus_id"] in modus_ids, f"modus_stats unknown modus {ms['modus_id']}")
conflicts = sorted({ms["modus_id"] for ms in kb["modus_stats"] if ms.get("conflict")})
common = sorted(set(m for m in ("accounts_blocked", "accounts_reported") if m in series))
blocked_share = [dict(cutoff=o["cutoff"], share=round(o["value"] / at("accounts_reported", o["cutoff"]), 10)) for o in series["accounts_blocked"] if at("accounts_reported", o["cutoff"])]
returned_share = [dict(cutoff=o["cutoff"], share=round(o["value"] / at("funds_blocked_idr", o["cutoff"]), 10)) for o in series["funds_returned_idr"] if at("funds_blocked_idr", o["cutoff"])]
reports_growth = []
rt = [o for o in series["reports_total"]]
for x, y in zip(rt, rt[1:]):
    reports_growth.append(dict(start=x["cutoff"], end=y["cutoff"], added=y["value"] - x["value"]))
g_anti = dict(as_of=L, sources=len(src), sources_by_kind={k: sum(1 for s in kb["sources"] if s["kind"] == k) for k in ("official", "media", "media-headline")},
              institutions=sorted(inst), channels=sorted(chan), modus=len(kb["modus"]), modus_conflicts=conflicts,
              latest={m: dict(value=o["value"], cutoff=o["cutoff"]) for m, o in sorted(latest.items())},
              series_reports_total=series["reports_total"], reports_growth=reports_growth,
              blocked_share_of_reported=blocked_share, returned_share_of_blocked=returned_share,
              satgas_latest=max(kb["satgas_pasti_stats"], key=lambda s: (s["cutoff"], s["metric"])), satgas=kb["satgas_pasti_stats"],
              ojk_consumer=kb["ojk_consumer_stats"], region_top=max(kb["region_stats"]["regions"], key=lambda r: r["reports"])["region"],
              modus_stats_belanja_reports=next(ms["reports"] for ms in kb["modus_stats"] if ms["modus_id"] == "belanja-online"),
              iasc_required_doc_groups=sorted(k for k in kb["iasc"]["required_data"] if k != "source_ids"), faq_count=len(kb["iasc"]["faq_official"]),
              faq_unanswered=sum(1 for f in kb["iasc"]["faq_official"] if f["a"] is None), literacy=kb["literacy"])

# ------------------------------------------------------------------ Regulation catalog
docs = {d["id"]: d for d in cat["documents"]}
check(len(docs) == len(cat["documents"]), "duplicate doc id")
allowed = set(cat["meta"]["allowed_domains"])
for d in cat["documents"]:
    check(d["corpus"] in {"umum", "keuangan"}, f"corpus {d['id']}")
    check(d["source"] in {"input", "fetch", "catalog-only"}, f"source {d['id']}")
    check((d["source"] == "input") == (d["input_no"] is not None), f"input_no {d['id']}")
    if d["source"] == "fetch":
        check(bool(d["official_pages"] or d["pdf_candidates"] or d["resolve_query"]), f"no way to fetch {d['id']}")
    for u in d["official_pages"] + d["pdf_candidates"]:
        check(urlparse(u).scheme == "https" and urlparse(u).netloc in allowed, f"url outside allowed domains {d['id']}: {u}")
    for k in d["key_provisions"]:
        check(k["status"] in {"summary", "to_verify_on_ingest"}, f"kp status {d['id']}")
        check(k["status"] == "to_verify_on_ingest" or len(k["verified_by"]) >= 1, f"summary without verification {d['id']} {k['ref']}")
        check(not re.search(r"Rp\s?\d", k["summary"]) or d["id"] in {"uu-1-2023-kuhp", "perma-2-2015-jo-4-2019", "uu-1-2024-ite"}, f"amount in summary outside allowed docs {d['id']}")
    for an in d["anchors"]:
        check(set(an) == {"pasal", "must_contain"}, f"anchor {d['id']}")
    for rel, inv in (("amends", "amended_by"), ("revokes", "revoked_by")):
        for r in d[rel]:
            check(r in docs, f"{d['id']}.{rel} -> unknown {r}")
            if r in docs: check(d["id"] in docs[r][inv], f"asymmetric {d['id']}.{rel} -> {r}")
    for rel, inv in (("amended_by", "amends"), ("revoked_by", "revokes")):
        for r in d[rel]:
            check(r in docs and d["id"] in docs[r][inv], f"asymmetric {d['id']}.{rel} -> {r}")
    check(d["status"] != "dicabut" or d["revoked_by"], f"revoked without revoked_by {d['id']}")
    for r in d.get("penalty_adjusted_by", []):
        check(r in docs, f"{d['id']}.penalty_adjusted_by -> unknown {r}")
by = lambda f: {k: sum(1 for d in cat["documents"] if f(d) == k) for k in sorted({f(d) for d in cat["documents"]})}
g_cat = dict(documents=len(docs), by_corpus=by(lambda d: d["corpus"]), by_type=by(lambda d: d["type"]), by_source=by(lambda d: d["source"]),
             ids_by_corpus={c: sorted(i for i, d in docs.items() if d["corpus"] == c) for c in ("umum", "keuangan")},
             inputs={d["id"]: d["input_no"] for d in cat["documents"] if d["source"] == "input"},
             fetch=sorted(i for i, d in docs.items() if d["source"] == "fetch"), catalog_only=sorted(i for i, d in docs.items() if d["source"] == "catalog-only"),
             revoked=sorted(i for i, d in docs.items() if d["status"] == "dicabut"), metadata_verified=sum(1 for d in cat["documents"] if d["metadata_verified"]),
             anchors=[dict(doc_id=i, **an) for i, d in docs.items() for an in d["anchors"]],
             cross_corpus=sorted(i for i, d in docs.items() if d["also_relevant_to"]), penalty_adjusted=sorted(i for i, d in docs.items() if d.get("penalty_adjusted_by")), effective={i: d["effective"] for i, d in docs.items() if d["effective"]})

# ------------------------------------------------------------------ Flows
g_flows = []
used_docs, used_channels = set(), set()
for f in fl["flows"]:
    check(f["dex"] in {"finlaiwyer", "mylaiwyer"}, f"flow dex {f['id']}")
    nodes = {n["id"]: n for n in f["nodes"]}
    check(f["entry"] in nodes, f"entry {f['id']}")
    reach, stack = set(), [f["entry"]]
    while stack:
        x = stack.pop()
        if x in reach: continue
        reach.add(x)
        for o in nodes[x].get("options", []):
            check(o["next"] in nodes, f"bad next {f['id']} {o}"); stack.append(o["next"])
    check(reach == set(nodes), f"unreachable nodes in {f['id']}: {set(nodes) - reach}")
    results = [n for n in f["nodes"] if n["type"] == "result"]
    for r in results:
        check(len(r["steps"]) >= 1 and len(r["legal_bases"]) >= 1, f"result needs steps & bases {f['id']}/{r['id']}")
        for s in r["steps"]:
            for c in s["channels"]:
                check(c in chan, f"unknown channel {c} in {f['id']}"); used_channels.add(c)
        for b in r["legal_bases"]:
            check(b["doc_id"] in docs, f"unknown doc {b['doc_id']} in {f['id']}"); used_docs.add(b["doc_id"])
            if b["doc_id"] in docs: check(docs[b["doc_id"]]["source"] != "catalog-only", f"flow cites catalog-only doc {b['doc_id']}")
        for d in r["open_dex"]:
            check(d in DEX_IDS, f"open_dex {d}")
    g_flows.append(dict(id=f["id"], dex=f["dex"], nodes=len(nodes), questions=len(nodes) - len(results), results=len(results),
                        urgent_steps=sum(1 for r in results for s in r["steps"] if s["urgent"])))
g_fl = dict(flows=g_flows, by_dex={d: sum(1 for f in g_flows if f["dex"] == d) for d in ("finlaiwyer", "mylaiwyer")},
            docs_cited=sorted(used_docs), channels_used=sorted(used_channels))

if ERR:
    raise SystemExit("VALIDATION FAILED:\n" + "\n".join(ERR))
for sub, obj in (("antiscam", g_anti), ("law_catalog", g_cat), ("legal_flows", g_fl)):
    os.makedirs(os.path.join(a.out, sub), exist_ok=True)
    json.dump(obj, open(os.path.join(a.out, sub, "golden.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, allow_nan=False)
print("ok kb golden:", g_anti["as_of"], len(docs), "docs", len(g_flows), "flows")
