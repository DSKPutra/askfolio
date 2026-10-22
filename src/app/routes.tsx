// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Routes (§10.1): /, /ai, /dex, /dex/:dexId/:tab?/:entity?, /markets/:slug, /watchlist, /settings,
// /about, /legal/:page, /more. Pages are lazy-loaded (initial JS budget §14).
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { LoadingBlock } from '../components/ui';
import { Layout } from './Layout';
import { RouteError } from './RouteError';

const Home = lazy(() => import('../pages/Home'));
const DexHub = lazy(() => import('../pages/DexHub'));
const DexPage = lazy(() => import('../pages/DexPage'));
const MarketDetail = lazy(() => import('../pages/MarketDetail'));
const Watchlist = lazy(() => import('../pages/Watchlist'));
const Settings = lazy(() => import('../pages/Settings'));
const About = lazy(() => import('../pages/About'));
const Legal = lazy(() => import('../pages/Legal'));
const More = lazy(() => import('../pages/More'));
const NotFound = lazy(() => import('../pages/NotFound'));

const page = (el: ReactNode) => <Suspense fallback={<LoadingBlock />}>{el}</Suspense>;

export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(<Home />) },
      { path: 'ai', element: <Navigate to="/dex/finandex-ai/chat" replace /> },
      { path: 'dex', element: page(<DexHub />) },
      { path: 'dex/:dexId/:tab?/:entity?', element: page(<DexPage />) },
      { path: 'markets', element: <Navigate to="/dex/finandex-ai/markets" replace /> },
      { path: 'markets/:slug', element: page(<MarketDetail />) },
      { path: 'watchlist', element: page(<Watchlist />) },
      { path: 'settings', element: page(<Settings />) },
      { path: 'about', element: page(<About />) },
      { path: 'legal', element: <Navigate to="/legal/privacy" replace /> },
      { path: 'legal/:page', element: page(<Legal />) },
      { path: 'more', element: page(<More />) },
      { path: '*', element: page(<NotFound />) },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
