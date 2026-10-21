// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Input manifest helpers (§3): verification of bytes / SHA-256 / zip members against kit/manifest.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { INPUTS, KIT } from './paths';

export type InputEntry = {
  no: number;
  file: string;
  bytes: number;
  sha256: string;
  zip_entries?: number;
  zip_members_sample?: string[];
  zip_uncompressed_bytes?: number;
};

export const loadInputManifest = (): InputEntry[] =>
  (JSON.parse(readFileSync(join(KIT, 'manifest', 'input_files_manifest.json'), 'utf8')) as InputEntry[]).sort((a, b) => a.no - b.no);

export function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(path)
      .on('data', (c) => h.update(c))
      .on('end', () => resolve(h.digest('hex')))
      .on('error', reject);
  });
}

export type VerifyRow = { no: number; file: string; status: 'OK' | 'MISSING' | 'BAD'; detail: string };

export async function verifyInputs(dir = INPUTS): Promise<VerifyRow[]> {
  const out: VerifyRow[] = [];
  for (const f of loadInputManifest()) {
    const p = join(dir, f.file);
    if (!existsSync(p)) {
      out.push({ no: f.no, file: f.file, status: 'MISSING', detail: '' });
      continue;
    }
    const det: string[] = [];
    const size = statSync(p).size;
    if (size !== f.bytes) det.push(`bytes ${size} != ${f.bytes}`);
    if ((await sha256File(p)) !== f.sha256) det.push('sha256 mismatch');
    if (f.file.endsWith('.zip') && !det.length) {
      const names: string[] = [];
      unzipSync(new Uint8Array(readFileSync(p)), {
        filter: (info) => {
          names.push(info.name);
          return false;
        },
      });
      const files = names.filter((n) => !n.endsWith('/'));
      if (f.zip_entries !== undefined && files.length !== f.zip_entries && names.length !== f.zip_entries) det.push(`entries ${files.length} != ${f.zip_entries}`);
      const miss = (f.zip_members_sample ?? []).filter((m) => !names.includes(m));
      if (miss.length) det.push(`missing members ${miss.slice(0, 3).join(', ')}`);
      // Uncompressed sizes are not checked here: fflate reports zip64 entries as 0xFFFFFFFF
      // (they were verified in phase 0, docs/INPUTS_VERIFIED.md).
    }
    out.push({ no: f.no, file: f.file, status: det.length ? 'BAD' : 'OK', detail: det.join('; ') });
  }
  return out;
}
