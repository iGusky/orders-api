import { Navigate, NavLink, useLocation } from 'react-router';
import { ChevronLeft, Store as StoreIcon } from 'lucide-react';
import { useAuth, useCurrentUser } from '../../auth/AuthContext';
import type { StoreLocationState } from '../../auth/RequireStore';
import { SignOutButton } from '../../components/SignOutButton';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AppFooter } from '../../components/AppFooter';
import { CreateStoreForm } from './CreateStoreForm';

// Alta de la tienda propia (D16, D26). <RequireStore> manda aquí a quien no pertenece a ninguna tienda; al registrarla
// se vuelve su tienda activa y regresa a la pantalla que se pidió. Quien ya es dueño de una no puede crear otra.
// Sin tiendas no hay back: no hay a dónde volver. Quien ya es empleado en otra llega por "Registrar mi propia tienda".
export function CreateStorePage() {
  const user = useCurrentUser();
  const { addOwnedStore, refresh } = useAuth();
  const location = useLocation();
  const from = (location.state as StoreLocationState | null)?.from ?? '/';

  if (user.stores.some((store) => store.role === 'OWNER')) return <Navigate to={from} replace />;

  const firstName = user.name.split(' ')[0];
  const hasStores = user.stores.length > 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      {hasStores && (
        <NavLink
          to="/"
          aria-label="Volver"
          className="-ml-3 mt-3 grid size-touch place-items-center rounded-full text-ink active:bg-primary-soft"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </NavLink>
      )}
      <header className={`${hasStores ? '' : 'mt-8 '}flex items-start justify-between gap-3`}>
        <div className="flex min-w-0 flex-col gap-2">
          <StoreIcon className="size-8 text-ink-muted" aria-hidden />
          <h1 className="text-2xl">Registra tu tienda</h1>
          <p className="text-ink-muted">
            Hola, {firstName}. Antes de empezar, cuéntanos de tu negocio. Tus productos y movimientos quedarán
            guardados en esta tienda.
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {!hasStores && (
        <section aria-label="Trabajas en otra tienda" className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
          <p>
            ¿Trabajas en la tienda de alguien más? Pídele al dueño que te agregue con tu correo{' '}
            <span className="font-semibold break-all">{user.email}</span>.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="flex min-h-touch items-center justify-center self-start rounded-full px-3 font-semibold text-primary active:bg-primary-soft"
          >
            Ya me agregaron
          </button>
        </section>
      )}

      <CreateStoreForm onCreated={addOwnedStore} onAlreadyRegistered={refresh} />

      <AppFooter />
    </main>
  );
}
