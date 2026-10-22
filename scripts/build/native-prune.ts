// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// After `vite build` for native shells (§14): keep only data `core/` (+ manifest) in dist so the app
// bundle stays small; `heavy/` is fetched from the production DATA_BASE_URL at runtime.
import { existsSync, rmSync } from 'node:fs';

for (const p of ['dist/data/heavy', 'dist/licenses.json.map']) if (existsSync(p)) rmSync(p, { recursive: true, force: true });
console.log('native-prune: removed dist/data/heavy (core/ and manifest.json bundled)');
