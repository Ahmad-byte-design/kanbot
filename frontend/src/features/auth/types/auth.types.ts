import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../../types/api';

/** The signed-in user, as returned by the API. */
export type AuthUser = User;

/** A token + user pair returned by register/login. */
export type AuthSession = AuthResponse;

export type LoginInput = LoginRequest;

/** Registration form payload: the API fields plus the confirmation field. */
export type SignupInput = RegisterRequest & { confirmPassword: string };

export interface AuthApi {
  register(input: RegisterRequest): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  me(): Promise<AuthUser>;
}
