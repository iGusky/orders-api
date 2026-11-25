import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getActiveStoreId,
  getApiErrorBody,
  getMe,
  getRequestFailure,
  loginWithGoogle,
  logout,
  onStoreUnavailable,
  onUnauthorized,
  setActiveStoreId,
} from '../services/api';
import { disableGoogleAutoSelect } from '../services/googleIdentity';
import type { CurrentUser } from '../types/auth';
import type { StoreInfo } from '../types/store';
import { pickInitialStoreId, rememberStoreId } from './activeStore';
import { AuthContext, SessionNotSavedError, type AuthContextValue, type AuthState } from './AuthContext';

// La tienda activa vive en dos lugares que deben coincidir: el estado (para la UI) y http.ts (para el header
// X-Store-Id, D28). Se fija en http.ts antes de cambiar el estado para que las peticiones que lance el siguiente
// render ya salgan con la tienda correcta.

function authenticated(user: CurrentUser): AuthState {
  const activeStoreId = pickInitialStoreId(user.stores);
  setActiveStoreId(activeStoreId);
  if (activeStoreId) rememberStoreId(activeStoreId);
  return { status: 'authenticated', user, activeStoreId };
}

function anonymous(expired?: boolean): AuthState {
  setActiveStoreId(null);
  return { status: 'anonymous', expired };
}

// El frontend nunca ve la sesión: vive en una cookie httpOnly (D22). Solo pregunta a GET /me quién es la persona.
// Sin sesión, GET /me responde 401 SESSION_NOT_FOUND.
async function fetchAuthState(signal?: AbortSignal): Promise<AuthState> {
  try {
    return authenticated(await getMe({ signal }));
  } catch (error) {
    if (getApiErrorBody(error)?.statusCode === 401) return anonymous();
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
      onUnauthorized(() => {
        setActiveStoreId(null);
        setState((current) => ({ status: 'anonymous', expired: current.status === 'authenticated' }));
      }),
    [],
  );

  // La API ya no deja operar en la tienda activa (404 STORE_NOT_FOUND: quitaron a la persona o se borró la tienda;
  // 400 STORE_NOT_SELECTED). Se deja sin tienda activa y <RequireStore> manda a elegir otra, o al alta si no le
  // queda ninguna. Nunca se cambia sola a otra tienda: lo que estaba capturando era para la anterior.
  useEffect(
    () =>
      onStoreUnavailable((storeId, reason) => {
        const active = getActiveStoreId();
        if (!active || (storeId && storeId !== active)) return; // Respuesta tardía de una tienda anterior.
        setActiveStoreId(null);
        setState((current) => {
          if (current.status !== 'authenticated') return current;
          if (reason === 'missing') return { ...current, activeStoreId: null };
          const lost = current.user.stores.find((store) => store.id === active);
          const stores = current.user.stores.filter((store) => store.id !== active);
          return { status: 'authenticated', user: { ...current.user, stores }, activeStoreId: null, lostStoreName: lost?.name };
        });
      }),
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
    setState(anonymous());
  }, []);

  const selectStore = useCallback((storeId: string) => {
    setActiveStoreId(storeId);
    rememberStoreId(storeId);
    setState((current) =>
      current.status === 'authenticated' ? { status: 'authenticated', user: current.user, activeStoreId: storeId } : current,
    );
  }, []);

  const addOwnedStore = useCallback((store: StoreInfo) => {
    const { id, name, address, phone, description, contactEmail } = store;
    setActiveStoreId(id);
    rememberStoreId(id);
    setState((current) => {
      if (current.status !== 'authenticated') return current;
      const owned = { id, name, address, phone, description, contactEmail, role: 'OWNER' as const };
      const others = current.user.stores.filter((s) => s.id !== id);
      return { status: 'authenticated', user: { ...current.user, stores: [owned, ...others] }, activeStoreId: id };
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, refresh, signIn, signOut, selectStore, addOwnedStore }),
    [state, refresh, signIn, signOut, selectStore, addOwnedStore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
