import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '../types/api';
import { request } from './client';

export const authService = {
  register(input: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('POST', '/auth/register', input);
  },

  login(input: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('POST', '/auth/login', input);
  },

  me(): Promise<MeResponse> {
    return request<MeResponse>('GET', '/auth/me');
  },
};
