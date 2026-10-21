# Finandex

**Wawasan Indeks Pasar Keuangan Global** · *Global Financial Market Indexing Insights*

© 2026 Dea Saka Kurnia Putra. All rights reserved. Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.

Finandex is a web app / PWA (with Capacitor Android & iOS builds) offering 27 data-grounded chatbots ("Dex")
over global and Indonesian market, macro, startup, social, and legal datasets. Historical data for information
and education only — not investment, financial, or legal advice.

## Development

Requires Node 24 LTS (`.nvmrc`).

```bash
npm install
npm run dev
```

Data inputs live in `data/inputs/` (gitignored) and are verified against `kit/manifest/input_files_manifest.json`
(`npm run data:verify`). See `docs/PROGRESS.md` for build status and `docs/DECISIONS.md` for technical decisions.

## License

Proprietary — see `LICENSE`. Third-party datasets and dependencies keep their own licenses.
