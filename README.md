# Askfolio

**Asisten AI investasi dengan angka terverifikasi** · *Your AI investing assistant, with verified numbers*

© 2026 Dea Saka Kurnia Putra. All rights reserved. Askfolio dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.

Askfolio is an AI investing assistant for Indonesian retail investors: ask in plain language and get answers whose
numbers come from the data (with charts and sources), plus an onboarding risk profile (risk appetite vs risk
capacity) that points to the asset classes that usually fit. It grew out of [Finandex](https://github.com/DSKPutra/finandex)
and reuses its datasets (published as releases of that repository). Production: https://askfolio-id.vercel.app.
Education only — not investment, financial, or legal advice.

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
