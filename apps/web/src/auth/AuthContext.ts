import { createContext, useContext } from 'react';
import type { CurrentUser } from '../types/auth';
import type { Store } from '../types/store';

// - loading: todavía no se sabe si hay sesión (GET /me en curso).
// - authenticated: GET /me respondió con la persona.
// - anonymous: no hay sesión (401), o se cerró.
// - error: no se pudo comprobar (red, 500). No es lo mismo que "sin sesión": se ofrece reintentar.
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'anonymous' }
  | { status: 'error' };

export interface AuthContextValue {
  state: AuthState;
  // Vuelve a preguntar a GET /me.
  refresh: () => Promise<void>;
  // Cambia el ID token de Google por una sesión y carga a la persona. Lanza si la API lo rechaza.
  signIn: (credential: string) => Promise<void>;
  // Cierra la sesión en la API (POST /auth/logout). Lanza si la API no responde.
  signOut: () => Promise<void>;
  // Guarda la tienda recién creada en la persona actual, sin volver a pedir GET /me.
  setStore: (store: Store) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return value;
}

// Para pantallas que ya están detrás de <RequireAuth>.
export function useCurrentUser(): CurrentUser {
  const { state } = useAuth();
  if (state.status !== 'authenticated') throw new Error('useCurrentUser requiere una sesión activa');
  return state.user;
}

// Para pantallas que ya están detrás de <RequireStore>: la persona y su tienda (D16).
export function useCurrentStore(): Store {
  const { store } = useCurrentUser();
  if (!store) throw new Error('useCurrentStore requiere una tienda registrada');
  return store;
}
