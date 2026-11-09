import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { getMe, loginWithGoogle, logout, onUnauthorized } from '../services/api';
import { disableGoogleAutoSelect } from '../services/googleIdentity';
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext';

// El frontend nunca ve la sesión: vive en una cookie httpOnly (D22). Solo pregunta a GET /me quién es la persona.
async function fetchAuthState(signal?: AbortSignal): Promise<AuthState> {
  try {
    const user = await getMe({ signal });
    return { status: 'authenticated', user };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return { status: 'anonymous' };
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchAuthState(controller.signal)
      .then(setState)
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);

  // Cualquier 401 (sesión vencida o revocada) manda a iniciar sesión.
  useEffect(() => onUnauthorized(() => setState({ status: 'anonymous' })), []);

  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState(await fetchAuthState());
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  const signIn = useCallback(async (credential: string) => {
    await loginWithGoogle({ credential });
    const next = await fetchAuthState();
    // La API aceptó el token pero GET /me no reconoce la sesión: la cookie no se guardó (CORS, SameSite).
    if (next.status !== 'authenticated') throw new Error('La sesión no quedó guardada en el navegador');
    setState(next);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    disableGoogleAutoSelect();
    setState({ status: 'anonymous' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, refresh, signIn, signOut }),
    [state, refresh, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
