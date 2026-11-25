import { Check, Store as StoreIcon } from 'lucide-react';
import type { MemberStore } from '../types/store';
import { STORE_ROLE_LABEL } from '../utils/stores';

interface StoreListProps {
  stores: MemberStore[];
  activeId: string | null;
  onSelect: (storeId: string) => void;
}

// Las tiendas de la persona con su rol en cada una; la activa lleva una palomita (RF7).
export function StoreList({ stores, activeId, onSelect }: StoreListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {stores.map((store) => {
        const active = store.id === activeId;
        return (
          <li key={store.id}>
            <button
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(store.id)}
              className={`flex min-h-16 w-full items-center gap-4 rounded-md border px-4 py-2 text-left ${active ? 'border-primary bg-primary-soft' : 'border-line bg-surface active:bg-primary-soft'}`}
            >
              <StoreIcon className="size-6 shrink-0 text-ink-muted" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-lg">{store.name}</span>
                <span className="text-sm text-ink-muted">{STORE_ROLE_LABEL[store.role]}</span>
              </span>
              {active && <Check className="size-6 shrink-0 text-primary" aria-label="Tienda actual" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
