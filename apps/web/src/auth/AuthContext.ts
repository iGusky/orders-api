import { createContext, useContext } from 'react';
import type { CurrentUser } from '../types/auth';
import type { RequestFailure } from '../services/api';
import type { StoreInfo } from '../types/store';

// - loading: todavía no se sabe si hay sesión (GET /me en curso).
// - authenticated: GET /me respondió con la persona.
// - anonymous: no hay sesión (401 SESSION_NOT_FOUND), o se cerró. `expired` indica que había una sesión abierta y la
//   API dejó de reconocerla (venció o se revocó): /iniciar-sesion lo explica.
// - error: no se pudo comprobar (sin red, 500). No es lo mismo que "sin sesión": se ofrece reintentar.
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'anonymous'; expired?: boolean }
  | { status: 'error'; failure: RequestFailure };

// La API aceptó el ID token pero GET /me no reconoce la sesión: el navegador no guardó la cookie (CORS, SameSite,
// cookies bloqueadas).
export class SessionNotSavedError extends Error {
  constructor() {
    super('La sesión no quedó guardada en el navegador');
    this.name = 'SessionNotSavedError';
  }
}

export interface AuthContextValue {
  state: AuthState;
  // Vuelve a preguntar a GET /me.
  refresh: () => Promise<void>;
  // Cambia el ID token de Google por una sesión y carga a la persona. Lanza el error de la API si la rechaza
  // (USER_INFO_NOT_FOUND_ON_GOOGLE, SESSION_NOT_FOUND) o SessionNotSavedError.
  signIn: (credential: string) => Promise<void>;
  // Cierra la sesión en la API (POST /auth/logout). Lanza si la API no responde.
  signOut: () => Promise<void>;
  // Guarda la tienda recién creada en la persona actual, sin volver a pedir GET /me.
  setStore: (store: StoreInfo) => void;
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
export function useCurrentStore(): StoreInfo {
  const { store } = useCurrentUser();
  if (!store) throw new Error('useCurrentStore requiere una tienda registrada');
  return store;
}
