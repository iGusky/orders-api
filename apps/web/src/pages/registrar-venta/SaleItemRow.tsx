import { CircleAlert, RotateCcw, Trash2 } from 'lucide-react';
import { QuantityStepper } from '../../components/QuantityStepper';
import { centsToInput, formatCents } from '../../utils/money';
import { listSubtotalCents, type SaleItem } from './sale';

interface SaleItemRowProps {
  item: SaleItem;
  quantityError?: string;
  lineTotalError?: string;
  onQuantityChange: (quantity: string) => void;
  onLineTotalChange: (lineTotal: string | null) => void;   // null = volver al precio de lista
  onRemove: () => void;
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <span id={id} className="flex items-center gap-1 text-sm text-danger">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {message}
    </span>
  );
}

export function SaleItemRow({ item, quantityError, lineTotalError, onQuantityChange, onLineTotalChange, onRemove }: SaleItemRowProps) {
  const { product } = item;
  const quantityId = `sale-quantity-${product.id}`;
  const amountId = `sale-amount-${product.id}`;
  const listSubtotal = listSubtotalCents(item);
  const edited = item.lineTotal !== null;
  const hasError = Boolean(quantityError || lineTotalError);

  return (
    <li className={`flex flex-col gap-3 rounded-md border bg-surface p-4 ${hasError ? 'border-danger' : 'border-line'}`}>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg">{product.name}</span>
          <span className="tabular flex flex-wrap gap-3 text-sm text-ink-muted">
            <span>{formatCents(product.priceCents)} c/u</span>
            <span>{product.stock} en stock</span>
          </span>
        </div>
        <button
          type="button"
          aria-label={`Quitar ${product.name}`}
          className="-mt-2 -mr-2 grid size-touch shrink-0 place-items-center rounded-full text-danger active:bg-danger-soft"
          onClick={onRemove}
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={quantityId} className="text-sm text-ink-muted">Cantidad</label>
          <QuantityStepper
            id={quantityId}
            value={item.quantity}
            onChange={onQuantityChange}
            max={Math.max(product.stock, 1)}
            invalid={Boolean(quantityError)}
            describedBy={quantityError ? `${quantityId}-error` : undefined}
          />
        </div>

        <div className="flex flex-col items-end gap-1">
          <label htmlFor={amountId} className="text-sm text-ink-muted">Importe</label>
          <span
            className={`flex h-touch-lg w-36 items-center rounded-md border px-3 focus-within:outline-3 focus-within:outline-primary ${
              lineTotalError ? 'border-danger bg-surface' : edited ? 'border-kraft-ink/40 bg-kraft' : 'border-line bg-background'
            }`}
          >
            <span className="text-ink-muted" aria-hidden>$</span>
            <input
              id={amountId}
              className="tabular w-full min-w-0 bg-transparent text-right text-lg font-semibold outline-none"
              inputMode="decimal"
              autoComplete="off"
              value={edited ? item.lineTotal ?? '' : centsToInput(listSubtotal)}
              aria-invalid={Boolean(lineTotalError)}
              aria-describedby={lineTotalError ? `${amountId}-error` : `${amountId}-detail`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onLineTotalChange(e.target.value)}
            />
          </span>
        </div>
      </div>

      {quantityError && <FieldError id={`${quantityId}-error`} message={quantityError} />}
      {lineTotalError && <FieldError id={`${amountId}-error`} message={lineTotalError} />}

      {edited && !lineTotalError ? (
        <div id={`${amountId}-detail`} className="flex flex-wrap items-center justify-between gap-2">
          <span className="tabular text-sm text-kraft-ink">Precio de lista: {formatCents(listSubtotal)}</span>
          <button
            type="button"
            onClick={() => onLineTotalChange(null)}
            className="flex h-touch items-center gap-2 rounded-md px-2 text-sm font-semibold text-kraft-ink active:bg-kraft"
          >
            <RotateCcw className="size-4" aria-hidden />
            Usar precio de lista
          </button>
        </div>
      ) : (
        <span id={`${amountId}-detail`} className="sr-only">Toca el importe para aplicar un descuento a este producto.</span>
      )}
    </li>
  );
}
