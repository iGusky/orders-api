import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { ChevronLeft, Store as StoreIcon } from 'lucide-react';
import { useActiveStore, useCurrentUser } from '../auth/AuthContext';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  children?: ReactNode;   // texto secundario bajo el título
  action?: ReactNode;     // acción junto al título (en iPad)
}

// Solo dentro de <RequireStore>. Si la persona tiene varias tiendas, muestra en cuál está operando (RF7).
export function PageHeader({ title, backTo = '/', children, action }: PageHeaderProps) {
  const { stores } = useCurrentUser();
  const store = useActiveStore();
  const showStore = store && stores.length > 1;
  return (
    <header className="flex flex-col gap-1 pt-3">
      <NavLink
        to={backTo}
        aria-label="Volver"
        className="-ml-3 grid size-touch place-items-center rounded-full text-ink active:bg-primary-soft"
      >
        <ChevronLeft className="size-6" aria-hidden />
      </NavLink>
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {showStore && (
            <p className="flex items-center gap-1 text-sm font-semibold text-ink-muted">
              <StoreIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{store.name}</span>
            </p>
          )}
          <h1 className="text-xl md:text-2xl">{title}</h1>
          {children && <p className="text-sm text-ink-muted">{children}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
