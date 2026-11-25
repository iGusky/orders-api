import { Navigate, NavLink, useLocation, useNavigate } from 'react-router';
import { CircleAlert, Store as StoreIcon } from 'lucide-react';
import { useAuth, useCurrentUser } from '../../auth/AuthContext';
import { CREATE_STORE_PATH, type StoreLocationState } from '../../auth/RequireStore';
import { AppFooter } from '../../components/AppFooter';
import { SignOutButton } from '../../components/SignOutButton';
import { StoreList } from '../../components/StoreList';
import { ThemeToggle } from '../../components/ThemeToggle';

// Elegir la tienda sobre la que se opera (RF7, D28). <RequireStore> manda aquí a quien tiene varias tiendas y no ha
// elegido en este dispositivo, o acaba de perder acceso a la que tenía activa. Al elegir regresa a la pantalla pedida.
export function StorePickerPage() {
  const user = useCurrentUser();
  const { state, selectStore } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as StoreLocationState | null)?.from ?? '/';

  if (user.stores.length === 0) return <Navigate to={CREATE_STORE_PATH} replace state={{ from } satisfies StoreLocationState} />;

  const activeStoreId = state.status === 'authenticated' ? state.activeStoreId : null;
  const lostStoreName = state.status === 'authenticated' ? state.lostStoreName : undefined;
  const ownsStore = user.stores.some((store) => store.role === 'OWNER');

  const choose = (storeId: string) => {
    selectStore(storeId);
    navigate(from, { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      <header className="mt-8 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <StoreIcon className="size-8 text-ink-muted" aria-hidden />
          <h1 className="text-2xl">¿En qué tienda vas a trabajar?</h1>
          <p className="text-ink-muted">Lo que registres quedará en esa tienda. Puedes cambiarla después desde el inicio.</p>
        </div>
        <div className="flex shrink-0 items-center">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {lostStoreName && (
        <div role="status" className="flex gap-3 rounded-lg border border-line bg-surface p-4">
          <CircleAlert className="size-6 shrink-0 text-ink-muted" aria-hidden />
          <p>
            Ya no tienes acceso a <span className="font-semibold">{lostStoreName}</span>. Lo que no se alcanzó a guardar
            no se registró. Elige otra tienda.
          </p>
        </div>
      )}

      <StoreList stores={user.stores} activeId={activeStoreId} onSelect={choose} />

      {!ownsStore && (
        <NavLink to={CREATE_STORE_PATH} className="flex min-h-touch items-center justify-center font-semibold text-primary">
          Registrar mi propia tienda
        </NavLink>
      )}

      <AppFooter />
    </main>
  );
}

export default StorePickerPage;
