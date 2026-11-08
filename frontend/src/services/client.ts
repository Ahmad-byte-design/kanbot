import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ApiErrorBody, ErrorCode } from '../types/api';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:4000/api';

/** The API root, exported for asset URLs that must be absolute. */
export const API_BASE_URL = API_URL;

/** Turns a server-relative asset path (`/api/assets/bg-1.jpg`) into a full URL. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_URL.replace(/\/api\/?$/i, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Error thrown by every failed API request. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: ApiErrorCode, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = (error: ApiError) => void;

let getToken: TokenGetter = () => null;
let handleUnauthorized: UnauthorizedHandler = () => {};
let unauthorizedHandlerInitialised = false;

/**
 * Registers how the API client reads the current token. Called once at startup
 * so services never import the store directly (and never create a cycle).
 */
export function configureTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

/** Called on any 401 that is not a login/registration attempt. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  handleUnauthorized = handler;
  unauthorizedHandlerInitialised = true;
}

export function isUnauthorizedHandled() {
  return unauthorizedHandlerInitialised;
}

/** Requests that may legitimately return 401 (wrong password) without ending the session. */
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

/**
 * The single axios instance used by every service.
 *
 * - `baseURL` comes from `VITE_API_URL`.
 * - The request interceptor attaches the bearer token.
 * - The response interceptor normalises every failure into an `ApiError` and
 *   triggers the global 401 handler for protected routes.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (!error.response) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return new ApiError(
      0,
      'NETWORK_ERROR',
      timedOut ? 'The server took too long to respond.' : 'Cannot reach the server. Is it running?',
    );
  }

  const { status, data } = error.response;
  return new ApiError(
    status,
    data?.error?.code ?? 'INTERNAL_ERROR',
    data?.error?.message ?? 'Something went wrong. Please try again.',
    data?.error?.details ?? [],
  );
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) return Promise.reject(error);

    const apiError = toApiError(error);
    const path = error.config?.url ?? '';

    if (
      apiError.status === 401 &&
      !PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath))
    ) {
      handleUnauthorized(apiError);
    }

    return Promise.reject(apiError);
  },
);

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const response = await apiClient.request<T>({
    method,
    url: path,
    data: body,
  });

  return response.data;
}

/** Maps `details[]` to `{ field: message }` so forms can show errors per input. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(error.details.map((detail) => [detail.path, detail.message]));
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
