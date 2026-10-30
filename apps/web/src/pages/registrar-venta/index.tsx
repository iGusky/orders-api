import { useCallback, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router';
import { Check, CircleAlert, Loader2, ShoppingBag } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ProductCombobox } from '../../components/ProductCombobox';
import { Toast } from '../../components/Toast';
import { createMovement, getApiErrorBody, getDomainError, getProductById } from '../../services/api';
import type { Product } from '../../types/product';
import { formatCents } from '../../utils/money';
import { OccurredAtField } from './OccurredAtField';
import { SaleItemRow } from './SaleItemRow';
import { SaleTotalTag } from './SaleTotalTag';
import {
  lineTotalError,
  listTotalCents,
  quantityError,
  quantityOf,
  saleTotalCents,
  saleTotalError,
  toMovementItems,
  type SaleItem,
} from './sale';

type Stage = 'idle' | 'checking' | 'saving';

interface SavedSale {
  pieces: number;
  totalCents: number;
}

function occurredAtError(value: string | null): string | undefined {
  if (value === null) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Elige la fecha y la hora.';
  if (date.getTime() > Date.now()) return 'La venta no puede ser en el futuro.';
  return undefined;
}

function requestErrorMessage(error: unknown): string {
  const domainError = getDomainError(error);
  if (domainError?.errorCode === 'INSUFFICIENT_STOCK') return 'Alguien más vendió unidades mientras capturabas. Revisa las cantidades.';
  if (domainError?.errorCode === 'PRODUCT_NOT_FOUND') return 'Uno de los productos ya no existe. Quítalo de la venta.';
  if (getApiErrorBody(error)?.statusCode === 400) return 'La API rechazó la venta. Revisa las cantidades y el total.';
  return 'No se pudo registrar la venta. Revisa tu conexión e inténtalo otra vez.';
}

function RequestError({ message, className }: { message: string; className: string }) {
  return (
    <p role="alert" className={`gap-2 rounded-md bg-danger-soft p-3 ${className}`}>
      <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
      {message}
    </p>
  );
}

export function SalePage() {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [occurredAt, setOccurredAt] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<SavedSale | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [optionsVersion, setOptionsVersion] = useState(0);

  const updateItems = (update: (current: SaleItem[]) => SaleItem[]) => {
    setItems(update);
    setRequestError(null);
  };

  const updateItem = (productId: string, changes: Partial<SaleItem>) =>
    updateItems((current) => current.map((item) => (item.product.id === productId ? { ...item, ...changes } : item)));

  // Cambiar la cantidad de un producto descarta su importe editado: se vuelve a calcular con el precio de lista.
  const changeQuantity = (productId: string, quantity: string) => updateItem(productId, { quantity, lineTotal: null });

  const addProduct = (product: Product | null) => {
    if (!product) return;
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) changeQuantity(product.id, String(Math.min(quantityOf(existing) + 1, product.stock)));
    else updateItems((current) => [...current, { product, quantity: '1', lineTotal: null }]);
  };

  const disabledReason = (product: Product) => {
    if (product.stock === 0) return 'Agotado';
    const inSale = items.find((item) => item.product.id === product.id);
    if (inSale && quantityOf(inSale) >= product.stock) return 'Ya agregaste todo el stock';
    return undefined;
  };

  const listCents = listTotalCents(items);
  const totalCents = saleTotalCents(items);
  const pieces = items.reduce((sum, item) => sum + quantityOf(item), 0);
  const totalErr = submitted && items.length > 0 ? saleTotalError(items) : undefined;
  const dateErr = occurredAtError(occurredAt);
  const emptyError = submitted && items.length === 0 ? 'Agrega al menos un producto.' : undefined;

  const busy = stage !== 'idle';
  const dismissToast = useCallback(() => setToast(null), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setRequestError(null);
    const hasErrors =
      items.length === 0 ||
      items.some((item) => quantityError(item, true) || lineTotalError(item)) ||
      saleTotalError(items) ||
      dateErr;
    if (hasErrors || totalCents === null || busy) return;

    // 1. Confirma con la API que sigue habiendo existencias de cada producto.
    setStage('checking');
    let fresh: Product[];
    try {
      fresh = await Promise.all(items.map((item) => getProductById(item.product.id)));
    } catch (error) {
      setStage('idle');
      setRequestError(
        getDomainError(error)?.errorCode === 'PRODUCT_NOT_FOUND'
          ? 'Uno de los productos ya no existe. Quítalo de la venta.'
          : 'No se pudieron revisar las existencias. Revisa tu conexión e inténtalo otra vez.',
      );
      return;
    }
    const outOfStock = fresh.some((product, index) => product.stock < quantityOf(items[index]));
    if (outOfStock) {
      // Se actualiza el stock mostrado sin descartar los importes editados: el usuario decide qué ajustar.
      setItems((current) => current.map((item, index) => ({ ...item, product: fresh[index] })));
      setStage('idle');
      setRequestError('El stock cambió desde que agregaste los productos. Revisa los marcados en rojo.');
      return;
    }

    // 2. Registra la venta.
    setStage('saving');
    try {
      await createMovement({
        type: 'SALE',
        items: toMovementItems(items),
        ...(occurredAt ? { ocurredAt: new Date(occurredAt).toISOString() } : {}),
      });
      setLastSaved({ pieces, totalCents });
      setToast('Venta registrada');
      setItems([]);
      setOccurredAt(null);
      setSubmitted(false);
      setOptionsVersion((v) => v + 1);
      window.scrollTo({ top: 0 });
    } catch (error) {
      setRequestError(requestErrorMessage(error));
    } finally {
      setStage('idle');
    }
  };

  const submitLabel = stage === 'checking' ? 'Revisando existencias…' : stage === 'saving' ? 'Guardando…' : 'Registrar venta';
  const submitButton = (className: string) => (
    <button
      type="submit"
      disabled={busy}
      className={`flex h-touch-lg items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ShoppingBag className="size-6" aria-hidden />}
      {submitLabel}
    </button>
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-safe pb-36 md:px-6 md:pb-10">
      <PageHeader title="Registrar venta" />

      {lastSaved && (
        <div role="status" className="flex gap-3 rounded-lg border border-primary bg-primary-soft p-4">
          <Check className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <p>
              Registraste una venta de <span className="tabular font-semibold">{lastSaved.pieces}</span>{' '}
              {lastSaved.pieces === 1 ? 'pieza' : 'piezas'} por <span className="tabular font-semibold">{formatCents(lastSaved.totalCents)}</span>.
            </p>
            <NavLink to="/movimientos" className="flex min-h-touch w-fit items-center font-semibold text-primary underline underline-offset-4">
              Ver movimientos
            </NavLink>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6 md:grid md:grid-cols-[3fr_2fr] md:items-start md:gap-8">
        <section aria-label="Productos" className="flex flex-col gap-4">
          <ProductCombobox
            label="Agregar producto"
            placeholder="Busca y toca para agregar"
            value={null}
            onChange={addProduct}
            refreshKey={optionsVersion}
            getDisabledReason={disabledReason}
            error={emptyError}
          />

          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-6 text-center text-ink-muted">
              Busca un producto para empezar la venta.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <SaleItemRow
                  key={item.product.id}
                  item={item}
                  quantityError={quantityError(item, submitted)}
                  lineTotalError={lineTotalError(item)}
                  onQuantityChange={(quantity) => changeQuantity(item.product.id, quantity)}
                  onLineTotalChange={(lineTotal) => updateItem(item.product.id, { lineTotal })}
                  onRemove={() => updateItems((current) => current.filter((it) => it.product.id !== item.product.id))}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Resumen" className="flex flex-col gap-6 md:sticky md:top-6">
          {items.length > 0 && (
            <SaleTotalTag pieces={pieces} productCount={items.length} listCents={listCents} totalCents={totalCents} error={totalErr} />
          )}

          <OccurredAtField value={occurredAt} onChange={setOccurredAt} error={dateErr} />

          {/* En celular el error se muestra en la barra fija, junto al botón */}
          {requestError && <RequestError message={requestError} className="hidden md:flex" />}

          {submitButton('hidden w-full md:flex')}
        </section>

        {/* Celular: total y acción fijos al alcance del pulgar */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-float md:hidden">
          {requestError && <RequestError message={requestError} className="flex text-sm" />}
          <div className="flex items-center gap-4">
            <span className="flex flex-col">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="tabular text-lg font-semibold">{totalCents !== null ? formatCents(totalCents) : "—"}</span>
            </span>
            {submitButton('flex-1')}
          </div>
        </div>
      </form>

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default SalePage;
