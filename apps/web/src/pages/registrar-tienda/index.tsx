import { Navigate, useLocation } from 'react-router';
import { Store as StoreIcon } from 'lucide-react';
import { useAuth, useCurrentUser } from '../../auth/AuthContext';
import type { CreateStoreLocationState } from '../../auth/RequireStore';
import { SignOutButton } from '../../components/SignOutButton';
import { ThemeToggle } from '../../components/ThemeToggle';
import { CreateStoreForm } from './CreateStoreForm';

// Alta de la tienda (D16). <RequireStore> manda aquí a quien todavía no tiene una; al registrarla regresa
// a la pantalla que se pidió. Sin back: no hay a dónde volver hasta que exista la tienda.
export function CreateStorePage() {
  const user = useCurrentUser();
  const { setStore } = useAuth();
  const location = useLocation();
  const from = (location.state as CreateStoreLocationState | null)?.from ?? '/';

  if (user.store) return <Navigate to={from} replace />;

  const firstName = user.name.split(' ')[0];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      <header className="mt-8 flex items-start justify-between gap-3">
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

      <CreateStoreForm onCreated={setStore} />
    </main>
  );
}
