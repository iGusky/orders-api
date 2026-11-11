import { http } from './http';
import type { CurrentUser, GoogleLoginInput } from '../../types/auth';

export { onStoreRequired, onUnauthorized } from './http';

// Cambia el ID token de Google por la sesión de la API. La cookie la pone la API; aquí no se lee (D22).
export async function loginWithGoogle(input: GoogleLoginInput): Promise<void> {
  await http.post('/auth/google', input);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

// 401 SESSION_NOT_FOUND si no hay sesión válida.
export async function getMe(options: { signal?: AbortSignal } = {}): Promise<CurrentUser> {
  const { data } = await http.get<CurrentUser>('/me', { signal: options.signal });
  return data;
}
