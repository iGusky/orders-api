import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Boxes, Plus, SearchX } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { ErrorPanel } from '../../components/ErrorPanel';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { SearchField } from '../../components/SearchField';
import { StockBadge } from '../../components/StockBadge';
import { Toast } from '../../components/Toast';
import { useQuery } from '../../hooks/useQuery';
import { getProducts } from '../../services/api';
import type { Product } from '../../types/product';
import { formatCents } from '../../utils/money';
import { CreateProductForm } from './CreateProductForm';

const PER_PAGE = 20;
const PAGE_PARAM = 'pagina';
const SEARCH_PARAM = 'buscar';

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function StockCount({ stock }: { stock: number }) {
  return (
    <span className="flex flex-col items-end">
      <span className="tabular text-lg font-semibold">{stock}</span>
      <span className="text-sm text-ink-muted">en stock</span>
    </span>
  );
}

// Celular: lista
function ProductList({ products }: { products: Product[] }) {
  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {products.map((product) => (
        <li key={product.id} className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-lg">{product.name}</span>
            {product.description && <span className="truncate text-sm text-ink-muted">{product.description}</span>}
            <span className="flex flex-wrap items-center gap-2">
              <span className="tabular text-sm text-ink-muted">{formatCents(product.priceCents)}</span>
              <StockBadge stock={product.stock} />
            </span>
          </span>
          <StockCount stock={product.stock} />
        </li>
      ))}
    </ul>
  );
}

// iPad y escritorio: tabla
function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-sm text-ink-muted">
            <th scope="col" className="px-5 py-3 font-normal">Producto</th>
            <th scope="col" className="px-5 py-3 text-right font-normal">Precio de lista</th>
            <th scope="col" className="px-5 py-3 text-right font-normal">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="h-16 border-t border-line first:border-t-0">
              <td className="px-5 py-3">
                <span className="flex flex-col">
                  <span className="text-lg">{product.name}</span>
                  {product.description && <span className="line-clamp-1 text-sm text-ink-muted">{product.description}</span>}
                </span>
              </td>
              <td className="tabular px-5 text-right">{formatCents(product.priceCents)}</td>
              <td className="px-5 text-right">
                <span className="flex items-center justify-end gap-3">
                  <StockBadge stock={product.stock} />
                  <span className="tabular w-12 text-lg font-semibold">{product.stock}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-md bg-line/50" />
      ))}
    </div>
  );
}

const primaryButton =
  'flex h-touch-lg items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed';

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get(PAGE_PARAM));
  const search = searchParams.get(SEARCH_PARAM) ?? '';

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { status, data, refetch } = useQuery(`products:${page}:${search}`, (signal) =>
    getProducts({ page, perPage: PER_PAGE, search: search || undefined }, { signal }),
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchParams(value ? { [SEARCH_PARAM]: value } : {}, { replace: true });
    },
    [setSearchParams],
  );

  const goToPage = (next: number) => {
    const params: Record<string, string> = {};
    if (search) params[SEARCH_PARAM] = search;
    if (next > 1) params[PAGE_PARAM] = String(next);
    setSearchParams(params);
    window.scrollTo({ top: 0 });
  };

  const closeSheet = useCallback(() => setCreating(false), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const handleCreated = (product: Product) => {
    setCreating(false);
    setToast(`${product.name} agregado`);
    // Los productos nuevos aparecen primero: se vuelve a la primera página sin búsqueda.
    if (page === 1 && !search) refetch();
    else setSearchParams({});
  };

  const addButton = (className = '') => (
    <button type="button" className={`${primaryButton} ${className}`} onClick={() => setCreating(true)}>
      <Plus className="size-6" aria-hidden />
      Agregar producto
    </button>
  );

  const hasProducts = status !== 'error' && data && data.data.length > 0;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-safe pb-32 md:px-6 md:pb-10">
      <PageHeader title="Inventario" action={addButton('hidden md:flex')}>
        {data && data.totalItems > 0 && (search
          ? `${data.totalItems} ${data.totalItems === 1 ? 'resultado' : 'resultados'}`
          : `${data.totalItems} ${data.totalItems === 1 ? 'producto' : 'productos'}`)}
      </PageHeader>

      <SearchField label="Buscar producto" placeholder="Buscar por nombre" value={search} onChange={handleSearch} />

      {status === 'loading' && !data && <LoadingRows />}

      {status === 'error' && (
        <ErrorPanel message="No se pudo cargar el inventario. Revisa tu conexión e inténtalo otra vez." onRetry={refetch} />
      )}

      {status !== 'error' && data && data.totalItems === 0 && !search && (
        <EmptyState icon={Boxes} message="Todavía no tienes productos. Agrega el primero para empezar a registrar ventas." />
      )}

      {status !== 'error' && data && data.totalItems === 0 && search && (
        <EmptyState icon={SearchX} message={`No hay productos con “${search}” en el nombre.`}>
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft"
          >
            Borrar búsqueda
          </button>
        </EmptyState>
      )}

      {status !== 'error' && data && data.totalItems > 0 && data.data.length === 0 && (
        <EmptyState icon={Boxes} message={`La página ${page} no existe.`}>
          <button
            type="button"
            onClick={() => goToPage(1)}
            className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft"
          >
            Ir a la primera página
          </button>
        </EmptyState>
      )}

      {hasProducts && (
        <div aria-busy={status === 'loading'} className={`flex flex-col gap-6 ${status === 'loading' ? 'opacity-60' : ''}`}>
          <ProductList products={data.data} />
          <ProductTable products={data.data} />
          <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />
        </div>
      )}

      {/* Celular: acción principal fija al alcance del pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-float md:hidden">
        {addButton('w-full')}
      </div>

      <BottomSheet open={creating} title="Agregar producto" onClose={closeSheet}>
        <CreateProductForm onCreated={handleCreated} onCancel={closeSheet} />
      </BottomSheet>

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default InventoryPage;
