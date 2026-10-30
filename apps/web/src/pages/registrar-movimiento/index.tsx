import { useCallback, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router';
import { Check, CircleAlert, Loader2 } from 'lucide-react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { OccurredAtField, occurredAtError } from '../../components/OccurredAtField';
import { PageHeader } from '../../components/PageHeader';
import { ProductCombobox } from '../../components/ProductCombobox';
import { Toast } from '../../components/Toast';
import { createMovement, getApiErrorBody, getDomainError } from '../../services/api';
import type { Product } from '../../types/product';
import { formatCents } from '../../utils/money';
import { MovementItemRow } from './MovementItemRow';
import { RefundTotalTag } from './RefundTotalTag';
import {
  KIND_META,
  MOVEMENT_KINDS,
  hasErrors,
  isRefund,
  maxQuantity,
  quantityError,
  quantityOf,
  refundError,
  refundTotalCents,
  refundTotalError,
  removesStock,
  toMovementInput,
  type MovementFormItem,
  type MovementKind,
} from './movementForm';

interface SavedMovement {
  kind: MovementKind;
  pieces: number;
  refundCents: number | null;
}

function requestErrorMessage(error: unknown): string {
  const domainError = getDomainError(error);
  if (domainError?.errorCode === 'INSUFFICIENT_STOCK') return 'Ya no hay stock suficiente de alguno de los productos. Revisa las cantidades.';
  if (domainError?.errorCode === 'PRODUCT_NOT_FOUND') return 'Uno de los productos ya no existe. Quítalo del movimiento.';
  if (getApiErrorBody(error)?.statusCode === 400) return 'La API rechazó el movimiento. Revisa las cantidades y los importes.';
  return 'No se pudo registrar el movimiento. Revisa tu conexión e inténtalo otra vez.';
}

export function MovementFormPage() {
  const [kind, setKind] = useState<MovementKind | null>(null);
  const [items, setItems] = useState<MovementFormItem[]>([]);
  const [occurredAt, setOccurredAt] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<SavedMovement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [optionsVersion, setOptionsVersion] = useState(0);

  const dismissToast = useCallback(() => setToast(null), []);

  const updateItems = (update: (current: MovementFormItem[]) => MovementFormItem[]) => {
    setItems(update);
    setRequestError(null);
  };

  const updateItem = (productId: string, changes: Partial<MovementFormItem>) =>
    updateItems((current) => current.map((item) => (item.product.id === productId ? { ...item, ...changes } : item)));

  const selectKind = (next: MovementKind) => {
    setKind(next);
    setSubmitted(false);
    setRequestError(null);
  };

  if (!kind) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
        <PageHeader title="Registrar movimiento">Devoluciones, mermas y ajustes de stock.</PageHeader>
        <KindPicker kind={kind} onSelect={selectKind} />
      </main>
    );
  }

  const refund = isRefund(kind);
  const { submit, done, the, icon: SubmitIcon } = KIND_META[kind];

  const addProduct = (product: Product | null) => {
    if (!product) return;
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) updateItem(product.id, { quantity: String(Math.min(quantityOf(existing) + 1, maxQuantity(product, kind))) });
    else updateItems((current) => [...current, { product, quantity: '1', refund: '' }]);
  };

  const disabledReason = (product: Product) => {
    if (!removesStock(kind)) return undefined;
    if (product.stock === 0) return 'Agotado';
    const added = items.find((item) => item.product.id === product.id);
    if (added && quantityOf(added) >= product.stock) return 'Ya agregaste todo el stock';
    return undefined;
  };

  const pieces = items.reduce((sum, item) => sum + quantityOf(item), 0);
  const refundCents = refund ? refundTotalCents(items) : null;
  const totalErr = refund && submitted && items.length > 0 ? refundTotalError(items) : undefined;
  const dateErr = occurredAtError(occurredAt);
  const emptyError = submitted && items.length === 0 ? 'Agrega al menos un producto.' : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setRequestError(null);
    if (hasErrors(items, kind) || dateErr || saving) return;

    setSaving(true);
    try {
      await createMovement(toMovementInput(kind, items, occurredAt));
      setLastSaved({ kind, pieces, refundCents });
      setToast(done);
      setItems([]);
      setOccurredAt(null);
      setSubmitted(false);
      setOptionsVersion((v) => v + 1);
      window.scrollTo({ top: 0 });
    } catch (error) {
      setRequestError(requestErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-safe pb-40 md:px-6 md:pb-10">
      <PageHeader title="Registrar movimiento">Devoluciones, mermas y ajustes de stock.</PageHeader>

      {lastSaved && (
        <div role="status" className="flex gap-3 rounded-lg border border-primary bg-primary-soft p-4">
          <Check className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <p>
              Registraste {KIND_META[lastSaved.kind].a} de <span className="tabular font-semibold">{lastSaved.pieces}</span>{' '}
              {lastSaved.pieces === 1 ? 'pieza' : 'piezas'}
              {lastSaved.refundCents !== null && (
                <> por <span className="tabular font-semibold">{formatCents(lastSaved.refundCents)}</span></>
              )}
              .
            </p>
            <NavLink to="/movimientos" className="flex min-h-touch w-fit items-center font-semibold text-primary underline underline-offset-4">
              Ver movimientos
            </NavLink>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <KindPicker kind={kind} onSelect={selectKind} />

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
              Busca los productos que quieres registrar.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <MovementItemRow
                  key={item.product.id}
                  item={item}
                  maxQuantity={maxQuantity(item.product, kind)}
                  showRefund={refund}
                  quantityError={quantityError(item, kind, submitted)}
                  refundError={refundError(item, submitted)}
                  onQuantityChange={(quantity) => updateItem(item.product.id, { quantity })}
                  onRefundChange={(value) => updateItem(item.product.id, { refund: value })}
                  onRemove={() => updateItems((current) => current.filter((it) => it.product.id !== item.product.id))}
                />
              ))}
            </ul>
          )}
        </section>

        {refund && items.length > 0 && (
          <RefundTotalTag pieces={pieces} productCount={items.length} totalCents={refundCents} error={totalErr} />
        )}

        <OccurredAtField noun={the} value={occurredAt} onChange={setOccurredAt} error={dateErr} />

        {/* Celular: barra fija al alcance del pulgar. iPad: al final del formulario. */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-float md:static md:bg-transparent md:p-0 md:shadow-none">
          {requestError && (
            <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm md:text-base">
              <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
              {requestError}
            </p>
          )}
          <div className="flex items-center gap-4">
            {refund && (
              <span className="flex flex-col md:hidden">
                <span className="text-sm text-ink-muted">Reembolso</span>
                <span className="tabular text-lg font-semibold">{refundCents !== null ? formatCents(refundCents) : '—'}</span>
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex h-touch-lg flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50 md:flex-none"
            >
              {saving ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <SubmitIcon className="size-6" aria-hidden />}
              {saving ? 'Guardando…' : submit}
            </button>
          </div>
        </div>
      </form>

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

interface KindPickerProps {
  kind: MovementKind | null;
  onSelect: (kind: MovementKind) => void;
}

function KindPicker({ kind, onSelect }: KindPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">¿Qué quieres registrar?</legend>
      <div className="flex flex-wrap gap-2">
        {MOVEMENT_KINDS.map((option) => {
          const { label, icon: Icon } = KIND_META[option];
          return (
            <ChoiceChip key={option} selected={option === kind} onSelect={() => onSelect(option)}>
              <Icon className="size-5" aria-hidden />
              {label}
            </ChoiceChip>
          );
        })}
      </div>
      {kind && <p className="text-sm text-ink-muted">{KIND_META[kind].help}</p>}
    </fieldset>
  );
}

export default MovementFormPage;
