// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// App shell (§10.1): collapsible sidebar (tablet/desktop) grouped by category, bottom tab bar (mobile),
// global search (Ctrl/Cmd+K), offline banner, update prompt, footer.
import { clsx } from 'clsx';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { DexIcon } from '../components/DexCard';
import { APP_NAME } from '../config/brand';
import { DEX_GROUPS } from '../config/dex-groups';
import { visibleDex } from '../config/dex-registry';
import { DISTRIBUTION } from '../config/runtime';
import { useLocale } from '../lib/locale';
import { useOnline } from '../lib/online';
import { Footer } from './Footer';
import { UpdatePrompt } from './UpdatePrompt';

const CommandPalette = lazy(() => import('../components/CommandPalette'));

function SideLink({ to, children, collapsed, icon, end = false }: { to: string; children: string; collapsed: boolean; icon?: React.ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? children : undefined}
      className={({ isActive }) => clsx('flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm', isActive ? 'bg-surface-2 text-brand-text' : 'hover:bg-surface-2')}
    >
      {icon}
      <span className={clsx(collapsed && 'sr-only')}>{children}</span>
    </NavLink>
  );
}

function Sidebar({ collapsed, setCollapsed, openSearch }: { collapsed: boolean; setCollapsed: (v: boolean) => void; openSearch: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const dex = visibleDex(DISTRIBUTION);
  const glyph = (s: string) => (
    <span aria-hidden className="inline-flex w-6 justify-center">
      {s}
    </span>
  );
  return (
    <aside className={clsx('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface md:flex', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex items-center justify-between gap-2 p-3">
        <Link to="/" className="flex items-center gap-2" aria-label={APP_NAME}>
          <img src="/icons/finandex.svg" alt="" width={32} height={32} className="rounded-lg" />
          {!collapsed && <span className="font-display text-lg font-bold tracking-wide">{APP_NAME}</span>}
        </Link>
        <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? t('nav.expand') : t('nav.collapse')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-2">
          {collapsed ? '»' : '«'}
        </button>
      </div>
      <button type="button" onClick={openSearch} className="mx-3 mb-2 flex min-h-10 items-center gap-2 rounded-lg border border-border px-2 text-sm text-muted hover:bg-surface-2">
        {glyph('⌕')}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{t('nav.search')}</span>
            <kbd className="text-xs">⌘K</kbd>
          </>
        )}
      </button>
      <nav aria-label="Finandex" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <SideLink to="/" end collapsed={collapsed} icon={glyph('⌂')}>
          {t('nav.home')}
        </SideLink>
        <SideLink to="/dex/finandex-ai/markets" collapsed={collapsed} icon={glyph('◎')}>
          {t('nav.globalMarkets')}
        </SideLink>
        <SideLink to="/ai" collapsed={collapsed} icon={<DexIcon dex={{ icon: 'finandex-ai' }} size={24} />}>
          Finandex AI
        </SideLink>
        {DEX_GROUPS.map((g) => {
          const items = dex.filter((d) => d.group === g.id && d.id !== 'finandex-ai');
          if (!items.length) return null;
          return (
            <div key={g.id} className="pt-3">
              {!collapsed && <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.name[locale]}</p>}
              {items.map((d) => (
                <SideLink key={d.id} to={`/dex/${d.id}`} collapsed={collapsed} icon={<DexIcon dex={d} size={24} />}>
                  {d.name}
                </SideLink>
              ))}
            </div>
          );
        })}
        <div className="space-y-1 border-t border-border pt-3">
          <SideLink to="/watchlist" collapsed={collapsed} icon={glyph('☆')}>
            {t('nav.watchlist')}
          </SideLink>
          <SideLink to="/settings" collapsed={collapsed} icon={glyph('⚙')}>
            {t('nav.settings')}
          </SideLink>
          <SideLink to="/about" collapsed={collapsed} icon={glyph('ⓘ')}>
            {t('nav.about')}
          </SideLink>
        </div>
      </nav>
    </aside>
  );
}

function BottomNav() {
  const { t } = useTranslation();
  const item = (to: string, label: string, glyph: string, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => clsx('flex min-h-14 flex-1 flex-col items-center justify-center text-[11px]', isActive ? 'text-brand-text' : 'text-muted')}>
      <span aria-hidden className="text-lg leading-none">
        {glyph}
      </span>
      {label}
    </NavLink>
  );
  return (
    <nav aria-label="Finandex" className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden">
      {item('/', t('nav.home'), '⌂', true)}
      {item('/dex/finandex-ai/markets', t('nav.markets'), '◎')}
      <NavLink to="/ai" className="flex flex-1 items-center justify-center" aria-label="Finandex AI">
        <span className="-mt-6 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand bg-bg shadow-[0_0_16px_rgba(25,242,58,0.45)]">
          <img src="/icons/finandex-ai.svg" alt="" width={40} height={40} className="rounded-full" />
        </span>
      </NavLink>
      {item('/dex', t('nav.dex'), '▦', true)}
      {item('/more', t('nav.more'), '☰')}
    </nav>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const online = useOnline();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState(false);
  const openSearch = useCallback(() => setSearch(true), []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [loc.pathname]);
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-2">
        {t('nav.skip')}
      </a>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} openSearch={openSearch} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-bg/90 px-4 py-2 backdrop-blur md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label={APP_NAME}>
            <img src="/icons/finandex.svg" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-display font-bold tracking-wide">{APP_NAME}</span>
          </Link>
          <button type="button" onClick={openSearch} aria-label={t('nav.search')} className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-2">
            ⌕
          </button>
        </header>
        {!online && (
          <p role="status" className="bg-warning/15 px-4 py-2 text-center text-sm text-warning">
            {t('common.offline')}
          </p>
        )}
        <UpdatePrompt />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 outline-none md:pb-8">
          <Outlet />
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <div className="pb-20 md:hidden">
          <Footer />
        </div>
      </div>
      <BottomNav />
      {search && (
        <Suspense fallback={null}>
          <CommandPalette open={search} onOpenChange={setSearch} />
        </Suspense>
      )}
      <ScrollRestoration />
    </div>
  );
}
