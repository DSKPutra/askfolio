// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Component tests (jsdom): copyright & credit placement (§11), feature map (§10.2), DataTable, artifacts.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Footer } from '../../src/app/Footer';
import { ChartCard } from '../../src/components/chart/ChartCard';
import { DataTable } from '../../src/components/DataTable';
import { COPYRIGHT_ID, CREDIT_ID, PERSONAL_TAGLINE } from '../../src/config/brand';
import { FeatureMap } from '../../src/features/home/FeatureMap';
import { useApp } from '../../src/lib/store';
import About from '../../src/pages/About';

function wrap(el: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: '*', element: el }]);
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('branding', () => {
  it('footer shows the Indonesian copyright and legal links', () => {
    useApp.setState({ locale: 'id' });
    wrap(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(year > 2026 ? COPYRIGHT_ID.replace('2026', `2026–${year}`) : COPYRIGHT_ID)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Kebijakan Privasi' }).getAttribute('href')).toBe('/legal/privacy');
  });
  it('about page shows credit, personal tagline, and wordmark', () => {
    useApp.setState({ locale: 'id' });
    wrap(<About />);
    expect(screen.getByText(CREDIT_ID)).toBeTruthy();
    expect(screen.getByText(PERSONAL_TAGLINE)).toBeTruthy();
    expect(screen.getAllByAltText('Dea Saka Kurnia Putra').length).toBe(2);
  });
});

describe('feature map', () => {
  it('lists all 29 Dex in 8 categories and filters by text', () => {
    useApp.setState({ locale: 'id', hideNc: false });
    wrap(<FeatureMap />);
    expect(screen.getAllByRole('article')).toHaveLength(29);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(8 + 29);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'pasal' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
  it('hides NC Dex with the toggle', () => {
    useApp.setState({ locale: 'en', hideNc: false });
    wrap(<FeatureMap />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getAllByRole('article')).toHaveLength(23);
  });
});

describe('DataTable', () => {
  it('sorts by header and filters rows', () => {
    useApp.setState({ locale: 'en' });
    const rows = Array.from({ length: 12 }, (_, i) => ({ name: `n${i}`, v: i }));
    render(<DataTable columns={[{ key: 'name', label: 'Name' }, { key: 'v', label: 'Value' }]} rows={rows} title="t" />);
    expect(screen.getByText('12 rows')).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'n1' } });
    expect(screen.getByText('3 rows')).toBeTruthy();
    const th = screen.getByRole('columnheader', { name: /Value/ });
    fireEvent.click(within(th).getByRole('button'));
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });
});

describe('ChartCard non-canvas artifacts', () => {
  const src = { dex: 'mylaiwyer', dataset: 'UUD_45.pdf', as_of: 'per-document' };
  it('renders a law quote card with the page button', () => {
    useApp.setState({ locale: 'id' });
    wrap(<ChartCard artifact={{ id: 'a', kind: 'quote', title: 'Pasal 1', spec: { type: 'quote', doc_id: 'uud-1945-naskah-asli', doc_title: 'UUD 1945', pasal: 'Pasal 1', page: 2, text: 'Negara Indonesia ialah Negara Kesatuan' }, source: src }} />);
    expect(screen.getByText(/Negara Indonesia ialah/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lihat halaman asli' })).toBeTruthy();
    expect(screen.getByText(/per dokumen/)).toBeTruthy();
  });
  it('renders an info card with an open_dex link', () => {
    useApp.setState({ locale: 'en' });
    wrap(<ChartCard artifact={{ id: 'b', kind: 'card', title: 'Info', spec: { type: 'card', tone: 'link', body: 'Use RupiahDex', link: { dexId: 'rupiahdex', label: 'Open RupiahDex' } }, source: src }} />);
    expect(screen.getByRole('link', { name: /Open RupiahDex/ }).getAttribute('href')).toBe('/dex/rupiahdex');
  });
});
