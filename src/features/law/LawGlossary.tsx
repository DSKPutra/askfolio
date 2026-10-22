// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer "Glosarium": terms are looked up in the statutes themselves (search_law) — no definitions
// are written by Finandex or the model, so every meaning shown is quoted from a document.
import { useState } from 'react';
import { Chip } from '../../components/ui';
import { ToolPanel } from '../dex/ToolPanel';

const TERMS = ['penyidik', 'penyelidik', 'penyidikan', 'tersangka', 'terdakwa', 'praperadilan', 'penangkapan', 'penahanan', 'penggeledahan', 'penyitaan', 'saksi', 'keterangan ahli', 'penasihat hukum', 'bantuan hukum', 'putusan pengadilan', 'upaya hukum', 'ganti kerugian', 'rehabilitasi', 'kedaulatan', 'hak asasi'];

export function LawGlossary() {
  const [term, setTerm] = useState(TERMS[0]!);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TERMS.map((x) => (
          <Chip key={x} active={x === term} onClick={() => setTerm(x)}>
            {x}
          </Chip>
        ))}
      </div>
      <ToolPanel key={term} dex="mylaiwyer" panel={{ tool: 'search_law', input: { query: term, limit: 5 } }} />
    </div>
  );
}
