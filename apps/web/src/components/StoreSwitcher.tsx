import { useCallback, useState } from 'react';
import { NavLink } from 'react-router';
import { ArrowLeftRight, Store as StoreIcon } from 'lucide-react';
import { useAuth, useCurrentStore, useCurrentUser } from '../auth/AuthContext';
import { CREATE_STORE_PATH } from '../auth/RequireStore';
import { STORE_ROLE_LABEL } from '../utils/stores';
import { BottomSheet } from './BottomSheet';
import { StoreList } from './StoreList';

// Tienda activa en el inicio (RF7): siempre visible y, si la persona tiene varias, con el botón para cambiarla.
// Solo se cambia desde el inicio, para que nunca cambie a mitad de una captura.
export function StoreSwitcher() {
  const user = useCurrentUser();
  const store = useCurrentStore();
  const { selectStore } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const several = user.stores.length > 1;
  const ownsStore = user.stores.some((s) => s.role === 'OWNER');

  const choose = (storeId: string) => {
    selectStore(storeId);
    setOpen(false);
  };

  return (
    <section aria-label="Tienda actual" className="flex items-center gap-3 rounded-md border border-line bg-surface p-3">
      <StoreIcon className="size-6 shrink-0 text-ink-muted" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{store.name}</span>
        <span className="text-sm text-ink-muted">{STORE_ROLE_LABEL[store.role]}</span>
      </div>
      {several && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-touch shrink-0 items-center gap-2 rounded-full px-3 font-semibold text-primary active:bg-primary-soft"
        >
          <ArrowLeftRight className="size-5" aria-hidden />
          Cambiar
        </button>
      )}

      <BottomSheet open={open} title="Cambiar de tienda" onClose={close}>
        <div className="flex flex-col gap-4">
          <StoreList stores={user.stores} activeId={store.id} onSelect={choose} />
          {!ownsStore && (
            <NavLink to={CREATE_STORE_PATH} className="flex min-h-touch items-center justify-center font-semibold text-primary">
              Registrar mi propia tienda
            </NavLink>
          )}
        </div>
      </BottomSheet>
    </section>
  );
}
