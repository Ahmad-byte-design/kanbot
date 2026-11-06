import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { configureTokenGetter } from '../services/client';
import { useAuthStore } from '../features/auth/store/auth.store';

// Give async UI (route changes, cache refetches) room on slow CI machines.
configure({ asyncUtilTimeout: 4_000 });

// Mirror main.tsx so API requests call the real token source in tests too.
configureTokenGetter(() => useAuthStore.getState().token);
