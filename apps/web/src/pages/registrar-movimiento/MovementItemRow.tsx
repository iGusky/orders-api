import { Trash2 } from 'lucide-react';
import { FieldError } from '../../components/FieldError';
import { QuantityStepper } from '../../components/QuantityStepper';
import { formatCents } from '../../utils/money';
import { quantityOf, type MovementFormItem } from './movementForm';

interface MovementItemRowProps {
  item: MovementFormItem;
  maxQuantity: number;
  showRefund: boolean;
  quantityError?: string;
  refundError?: string;
  onQuantityChange: (quantity: string) => void;
  onRefundChange: (refund: string) => void;
  onRemove: () => void;
}

export function MovementItemRow({ item, maxQuantity, showRefund, quantityError, refundError, onQuantityChange, onRefundChange, onRemove }: MovementItemRowProps) {
  const { product } = item;
  const quantityId = `movement-quantity-${product.id}`;
  const refundId = `movement-refund-${product.id}`;
  const hasError = Boolean(quantityError || (showRefund && refundError));

  return (
    <li className={`flex flex-col gap-3 rounded-md border bg-surface p-4 ${hasError ? 'border-danger' : 'border-line'}`}>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg">{product.name}</span>
          <span className="tabular text-sm text-ink-muted">{product.stock} en stock</span>
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
          <label htmlFor={quantityId} className="text-sm text-ink-muted">Unidades</label>
          <QuantityStepper
            id={quantityId}
            value={item.quantity}
            onChange={onQuantityChange}
            max={Math.max(maxQuantity, 1)}
            invalid={Boolean(quantityError)}
            describedBy={quantityError ? `${quantityId}-error` : undefined}
          />
        </div>

        {showRefund && (
          <div className="flex w-full flex-col gap-1 sm:w-auto sm:items-end">
            <label htmlFor={refundId} className="text-sm text-ink-muted">Reembolso</label>
            <span
              className={`flex h-touch-lg w-full items-center rounded-md border bg-surface px-3 sm:w-36 focus-within:outline-3 focus-within:outline-primary ${refundError ? 'border-danger' : 'border-line'}`}
            >
              <span className="text-ink-muted" aria-hidden>$</span>
              <input
                id={refundId}
                className="tabular w-full min-w-0 bg-transparent text-right text-lg font-semibold outline-none"
                inputMode="decimal"
                autoComplete="off"
                value={item.refund}
                aria-invalid={Boolean(refundError)}
                aria-describedby={refundError ? `${refundId}-error` : `${refundId}-help`}
                onChange={(e) => onRefundChange(e.target.value)}
              />
            </span>
          </div>
        )}
      </div>

      {quantityError && <FieldError id={`${quantityId}-error`} message={quantityError} />}
      {showRefund && refundError && <FieldError id={`${refundId}-error`} message={refundError} />}
      {showRefund && !refundError && (
        <span id={`${refundId}-help`} className="tabular text-sm text-ink-muted">
          Precio de lista: {formatCents(product.priceCents * quantityOf(item))}
        </span>
      )}
    </li>
  );
}
