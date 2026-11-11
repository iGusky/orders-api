import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from './AuthContext';

export const CREATE_STORE_PATH = '/registrar-tienda';

// Estado de navegación con el que /registrar-tienda regresa a la pantalla que se pidió.
export interface CreateStoreLocationState {
  from?: string;
}

// Ruta de layout, dentro de <RequireAuth>: quien aún no registra su tienda (D16) va primero al alta.
// Los productos y movimientos pertenecen a la tienda (D17), así que sin ella no hay nada que mostrar.
export function RequireStore() {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user.store) {
    const from = location.pathname + location.search;
    return <Navigate to={CREATE_STORE_PATH} replace state={{ from } satisfies CreateStoreLocationState} />;
  }

  return <Outlet />;
}
