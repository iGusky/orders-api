import { Navigate, Outlet, useLocation } from 'react-router';
import { useActiveStore, useCurrentUser } from './AuthContext';

export const CREATE_STORE_PATH = '/registrar-tienda';
export const STORE_PICKER_PATH = '/elegir-tienda';

// Estado de navegación con el que /registrar-tienda y /elegir-tienda regresan a la pantalla que se pidió.
export interface StoreLocationState {
  from?: string;
}

// Ruta de layout, dentro de <RequireAuth>: los productos y movimientos pertenecen a una tienda (D17), así que sin
// tienda activa no hay nada que mostrar.
// - Sin ninguna tienda (ni propia ni como empleado): al alta, que también explica cómo pedir acceso (RF9).
// - Con tiendas pero sin activa (tiene varias y no eligió, o perdió acceso a la activa): a elegir (RF7).
export function RequireStore() {
  const user = useCurrentUser();
  const activeStore = useActiveStore();
  const location = useLocation();
  const from = location.pathname + location.search;

  if (user.stores.length === 0) {
    return <Navigate to={CREATE_STORE_PATH} replace state={{ from } satisfies StoreLocationState} />;
  }
  if (!activeStore) {
    return <Navigate to={STORE_PICKER_PATH} replace state={{ from } satisfies StoreLocationState} />;
  }

  return <Outlet />;
}
