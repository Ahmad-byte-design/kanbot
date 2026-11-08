import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { useAuthStore } from './features/auth/store/auth.store';
import { initializeTheme } from './features/theme';
import { initializeLocale } from './i18n';
import { configureTokenGetter, setUnauthorizedHandler } from './services/client';
import './index.css';

// Apply the persisted theme and language before the first paint.
initializeTheme();
initializeLocale();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// The API client asks the store for the token on every request.
configureTokenGetter(() => useAuthStore.getState().token);

/**
 * AUTH-6: any 401 outside login/register ends the session and returns to
 * /login with the current page remembered and an explanatory message.
 * A full navigation keeps this reliable even when it happens during bootstrap.
 */
setUnauthorizedHandler(() => {
  useAuthStore.getState().signOut();
  queryClient.clear();
  const current = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ redirect: current, expired: '1' });
  window.location.assign(`/login?${params.toString()}`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
