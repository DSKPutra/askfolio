// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// UI state (zustand) persisted on the device only (§13.2): theme, locale, colour-blind mode, watchlist,
// consent (with policy version), client id. Chat history lives in IndexedDB (lib/history.ts).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../config/brand';

export const POLICY_VERSION = '2026-10-22';

export type WatchItem = { dexId: string; entity: string; label: string };

type State = {
  theme: 'dark' | 'light' | 'system';
  locale: Locale;
  colorblind: boolean;
  hideNc: boolean;
  watchlist: WatchItem[];
  consentVersion: string | null;
  clientId: string;
  setTheme: (t: State['theme']) => void;
  setLocale: (l: Locale) => void;
  setColorblind: (v: boolean) => void;
  setHideNc: (v: boolean) => void;
  toggleWatch: (w: WatchItem) => void;
  acceptConsent: () => void;
  resetAll: () => void;
};

const deviceLocale = (): Locale => (typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'id');
const uuid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000');

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      locale: deviceLocale(),
      colorblind: false,
      hideNc: false,
      watchlist: [],
      consentVersion: null,
      clientId: uuid(),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setColorblind: (colorblind) => set({ colorblind }),
      setHideNc: (hideNc) => set({ hideNc }),
      toggleWatch: (w) => {
        const has = get().watchlist.some((x) => x.dexId === w.dexId && x.entity === w.entity);
        set({ watchlist: has ? get().watchlist.filter((x) => !(x.dexId === w.dexId && x.entity === w.entity)) : [...get().watchlist, w] });
      },
      acceptConsent: () => set({ consentVersion: POLICY_VERSION }),
      resetAll: () => set({ watchlist: [], consentVersion: null, clientId: uuid() }),
    }),
    { name: 'finandex-ui', version: 1 },
  ),
);
