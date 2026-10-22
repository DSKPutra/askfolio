// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// App root: TanStack Query, router, and device preferences (theme, colour-blind mode, language).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { useApplyPreferences } from '../lib/theme';
import { createRouter } from './routes';

export function App() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }));
  const [router] = useState(createRouter);
  useApplyPreferences();
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
