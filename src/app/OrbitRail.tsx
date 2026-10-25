// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Side menu (desktop/tablet ≥ 768 px), simplified for Askfolio: logo plus five labelled destinations — Home, Ask, Risk
// profile, Data, Settings. Every topic is reached from Data (/data) or by asking; no category tree in the chrome.
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';

type Item = { to: string; label: string; glyph: string; end?: boolean };

export function OrbitRail() {
  const { t } = useTranslation();
  const items: Item[] = [
    { to: '/', label: t('nav.home'), glyph: '⌂', end: true },
    { to: '/ai', label: t('nav.ask'), glyph: '✦' },
    { to: '/profil-risiko', label: t('nav.profile'), glyph: '◎' },
    { to: '/data', label: t('nav.data'), glyph: '▦' },
    { to: '/settings', label: t('nav.settings'), glyph: '⚙' },
  ];
  return (
    <nav aria-label={t('nav.rail')} className="sticky top-0 z-40 hidden h-dvh w-[84px] shrink-0 flex-col items-center gap-1 border-r border-edge bg-pane py-3 md:flex">
      <Link to="/" aria-label="Askfolio" className="mb-3 flex h-12 w-12 items-center justify-center">
        <img src="/icons/finandex.svg" alt="" width={40} height={40} className="rounded-xl" />
      </Link>
      {items.map((x) => (
        <NavLink
          key={x.to}
          to={x.to}
          end={x.end ?? false}
          className={({ isActive }) => clsx('flex w-[72px] flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors', isActive ? 'bg-[color-mix(in_srgb,var(--primary)_12%,var(--pane))] text-primary' : 'text-ink-muted hover:bg-pane-2 hover:text-ink')}
        >
          <span aria-hidden className="text-lg leading-none">
            {x.glyph}
          </span>
          {x.label}
        </NavLink>
      ))}
    </nav>
  );
}
