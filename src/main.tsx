// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './i18n';
import { App } from './app/App';
import { registerPwa } from './pwa';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
registerPwa();
void import('./native').then(({ initNative }) => initNative(() => window.confirm(document.documentElement.lang === 'en' ? 'Exit Finandex?' : 'Keluar dari Finandex?')));
