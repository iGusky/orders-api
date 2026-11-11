import { Navigate, Outlet, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { ErrorPanel } from '../components/ErrorPanel';
import { useAuth } from './AuthContext';

export const SIGN_IN_PATH = '/iniciar-sesion';

// Estado de navegación con el que /iniciar-sesion regresa a la pantalla que se pidió.
export interface SignInLocationState {
  from?: string;
}

// Ruta de layout: las pantallas hijas solo se muestran con sesión (autenticación por defecto, D21).
export function RequireAuth() {
  const { state, refresh } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return (
      <main className="grid min-h-dvh place-items-center" aria-busy>
        <Loader2 className="size-8 animate-spin text-ink-muted" aria-label="Comprobando tu sesión" />
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="mx-auto flex max-w-2xl flex-col px-4 pt-safe pb-safe">
        <div className="mt-8">
          <ErrorPanel
            message={
              state.failure === 'server'
                ? 'No pudimos comprobar tu sesión: el servidor tuvo un problema. Inténtalo otra vez en un momento.'
                : 'No pudimos comprobar tu sesión. Revisa tu conexión e inténtalo otra vez.'
            }
            onRetry={refresh}
          />
        </div>
      </main>
    );
  }

  if (state.status === 'anonymous') {
    const from = location.pathname + location.search;
    return <Navigate to={SIGN_IN_PATH} replace state={{ from } satisfies SignInLocationState} />;
  }

  return <Outlet />;
}
