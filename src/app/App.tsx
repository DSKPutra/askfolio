// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Phase 1 placeholder shell; replaced by the full router/layout in phase 5.
import { APP_NAME, APP_TAGLINE_ID, copyrightFor } from '../config/brand';
import { DEX_GROUPS } from '../config/dex-groups';
import { DEX_REGISTRY } from '../config/dex-registry';

export function App() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">{APP_NAME}</h1>
      <p className="text-muted">{APP_TAGLINE_ID}</p>
      {DEX_GROUPS.map((g) => (
        <section key={g.id} className="mt-6">
          <h2 className="text-xl font-semibold">{g.name.id}</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {DEX_REGISTRY.filter((d) => d.group === g.id).map((d) => (
              <li key={d.id} className="rounded-xl border border-border bg-surface p-3">
                <img src={`/icons/${d.icon}.svg`} alt="" width={32} height={32} />
                <strong>{d.name}</strong>
                <p className="text-sm text-muted">{d.tagline.id}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <footer className="mt-10 text-sm text-muted">{copyrightFor('id', new Date().getFullYear())}</footer>
    </main>
  );
}
