import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getApiErrorBody,
  getMe,
  getRequestFailure,
  loginWithGoogle,
  logout,
  onStoreRequired,
  onUnauthorized,
} from '../services/api';
import { disableGoogleAutoSelect } from '../services/googleIdentity';
import type { StoreInfo } from '../types/store';
import { AuthContext, SessionNotSavedError, type AuthContextValue, type AuthState } from './AuthContext';

// El frontend nunca ve la sesión: vive en una cookie httpOnly (D22). Solo pregunta a GET /me quién es la persona.
// Sin sesión, GET /me responde 401 SESSION_NOT_FOUND.
async function fetchAuthState(signal?: AbortSignal): Promise<AuthState> {
  try {
    const user = await getMe({ signal });
    return { status: 'authenticated', user };
  } catch (error) {
    if (getApiErrorBody(error)?.statusCode === 401) return { status: 'anonymous' };
    throw error;
  }
}

function errorState(error: unknown): AuthState {
  return { status: 'error', failure: getRequestFailure(error) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchAuthState(controller.signal)
      .then(setState)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState(errorState(error));
      });
    return () => controller.abort();
  }, []);

  // Cualquier 401 (sesión vencida o revocada) manda a iniciar sesión. Si había alguien adentro, se le avisa por qué.
  useEffect(
    () =>
      onUnauthorized(() =>
        setState((current) => ({ status: 'anonymous', expired: current.status === 'authenticated' })),
      ),
    [],
  );

  // 403 USER_DONT_HAVE_STORE: la API ya no encuentra la tienda (por ejemplo, se borró). <RequireStore> manda al alta.
  useEffect(
    () =>
      onStoreRequired(() =>
        setState((current) =>
          current.status === 'authenticated' ? { status: 'authenticated', user: { ...current.user, store: null } } : current,
        ),
      ),
    [],
  );

  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState(await fetchAuthState());
    } catch (error) {
      setState(errorState(error));
    }
  }, []);

  const signIn = useCallback(async (credential: string) => {
    await loginWithGoogle({ credential });
    const next = await fetchAuthState();
    if (next.status !== 'authenticated') throw new SessionNotSavedError();
    setState(next);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    disableGoogleAutoSelect();
    setState({ status: 'anonymous' });
  }, []);

  const setStore = useCallback((store: StoreInfo) => {
    setState((current) =>
      current.status === 'authenticated' ? { status: 'authenticated', user: { ...current.user, store } } : current,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, refresh, signIn, signOut, setStore }),
    [state, refresh, signIn, signOut, setStore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
