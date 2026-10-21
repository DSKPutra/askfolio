// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run data:verify` — verify the 42 inputs against kit/manifest (§3.3). Exits non-zero on any problem.
import { verifyInputs } from './lib/inputs';

const rows = await verifyInputs();
const bad = rows.filter((r) => r.status !== 'OK');
for (const r of bad) console.error(`#${r.no} ${r.status} ${r.file} ${r.detail}`);
if (bad.length) {
  console.error(`Input verification failed: ${bad.length} of ${rows.length}`);
  process.exit(1);
}
console.log(`Inputs verified: ${rows.length}/${rows.length} OK`);
