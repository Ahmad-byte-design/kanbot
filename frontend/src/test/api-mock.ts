import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../services/client';

export interface MockReply {
  status?: number;
  data?: unknown;
}

export type MockHandler = (config: InternalAxiosRequestConfig) => MockReply;

/**
 * Replaces the axios transport with an in-memory adapter, so tests exercise
 * the real interceptors and services without touching the network.
 *
 * Returns the recorded requests (URL, method, headers) for assertions.
 */
export function mockApi(handler: MockHandler) {
  const calls: InternalAxiosRequestConfig[] = [];

  apiClient.defaults.adapter = async (config) => {
    calls.push(config);

    const { status = 200, data } = handler(config);
    const response: AxiosResponse = {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    };

    if (status >= 200 && status < 300) return response;

    // Axios only normalises status codes inside its built-in adapters, so a
    // custom adapter has to reject non-2xx responses itself.
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
      config,
      null,
      response,
    );
  };

  return calls;
}

/** Simulates a request that never reached the server. */
export function networkError(): never {
  throw new AxiosError('Network Error', 'ERR_NETWORK');
}
