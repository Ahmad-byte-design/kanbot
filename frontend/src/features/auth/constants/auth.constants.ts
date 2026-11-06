export const AUTH_ROUTES = {
  root: '/',
  projects: '/projects',
  login: '/login',
  register: '/register',
} as const;

export const AUTH_STORAGE_KEY = 'auth-storage';

export const AUTH_MESSAGES = {
  signInTitle: 'Welcome back',
  signInDescription: 'Sign in to pick up where your sprint left off.',
  signUpTitle: 'Create your account',
  signUpDescription: 'Your board, backlog and AI teammate are one minute away.',
  sessionExpired: 'Your session has expired. Please log in again.',
} as const;
