import type { CreateMovementInput, CreateMovementItemInput } from '../../types/movement';
import type { Product } from '../../types/product';
import { MAX_CENTS, parsePesos } from '../../utils/money';
import { MOVEMENT_TYPE_META } from '../../utils/movements';

// Límite de la columna Int de PostgreSQL: el stock resultante no puede pasarlo.
const MAX_STOCK = 2_147_483_647;

export const MOVEMENT_KINDS = ['RETURN', 'SHRINKAGE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'] as const;
export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const KIND_META = {
  RETURN: {
    label: 'Devolución',
    icon: MOVEMENT_TYPE_META.RETURN.icon,
    help: 'Un cliente regresó producto: vuelve al stock y registras cuánto le reembolsaste.',
    the: 'la devolución',
    a: 'una devolución',
    submit: 'Registrar devolución',
    done: 'Devolución registrada',
  },
  SHRINKAGE: {
    label: 'Merma',
    icon: MOVEMENT_TYPE_META.SHRINKAGE.icon,
    help: 'Producto perdido, roto o dañado: sale del stock sin venderse.',
    the: 'la merma',
    a: 'una merma',
    submit: 'Registrar merma',
    done: 'Merma registrada',
  },
  ADJUSTMENT_IN: {
    label: 'Ajuste de entrada',
    icon: MOVEMENT_TYPE_META.ADJUSTMENT.icon,
    help: 'Corrige un error de captura o un conteo físico: suma unidades al stock.',
    the: 'el ajuste',
    a: 'un ajuste de entrada',
    submit: 'Registrar ajuste',
    done: 'Ajuste registrado',
  },
  ADJUSTMENT_OUT: {
    label: 'Ajuste de salida',
    icon: MOVEMENT_TYPE_META.ADJUSTMENT.icon,
    help: 'Corrige un error de captura o un conteo físico: resta unidades del stock.',
    the: 'el ajuste',
    a: 'un ajuste de salida',
    submit: 'Registrar ajuste',
    done: 'Ajuste registrado',
  },
} satisfies Record<MovementKind, object>;

export interface MovementFormItem {
  product: Product;
  quantity: string;   // texto del campo
  refund: string;     // reembolso del renglón en pesos, tal como se escribió; solo cuenta en una devolución
}

// Solo la devolución lleva dinero; en merma y ajustes el importe es 0 (D5, I7).
export const isRefund = (kind: MovementKind) => kind === 'RETURN';
export const removesStock = (kind: MovementKind) => kind === 'SHRINKAGE' || kind === 'ADJUSTMENT_OUT';

// Cantidad válida o 0 si el campo está vacío o es inválido.
export function quantityOf(item: MovementFormItem): number {
  const quantity = Number(item.quantity);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

export function maxQuantity(product: Product, kind: MovementKind): number {
  return removesStock(kind) ? product.stock : MAX_STOCK - product.stock;
}

export function quantityError(item: MovementFormItem, kind: MovementKind, submitted: boolean): string | undefined {
  const { quantity, product } = item;
  if (quantity.trim() === '') return submitted ? 'Escribe la cantidad.' : undefined;
  const value = Number(quantity);
  if (!Number.isInteger(value)) return 'Usa un número entero, sin decimales.';
  if (value < 1) return 'Registra al menos 1 unidad.';
  if (!removesStock(kind)) return value > maxQuantity(product, kind) ? 'La cantidad es demasiado grande.' : undefined;
  if (product.stock === 0) return 'Este producto está agotado.';
  if (value > product.stock) return `Solo hay ${product.stock} en stock.`;
  return undefined;
}

export function refundError(item: MovementFormItem, submitted: boolean): string | undefined {
  if (item.refund.trim() === '') return submitted ? 'Escribe cuánto reembolsaste.' : undefined;
  const cents = parsePesos(item.refund);
  if (cents === null) return 'Escribe el importe con números, por ejemplo 40 o 39.50.';
  if (cents > MAX_CENTS) return 'El importe es demasiado alto.';
  return undefined;
}

// Σ reembolsos (I3). null mientras falte un importe o alguno no sea válido.
export function refundTotalCents(items: MovementFormItem[]): number | null {
  let total = 0;
  for (const item of items) {
    const line = parsePesos(item.refund);
    if (line === null) return null;
    total += line;
  }
  return total;
}

// Un renglón puede valer $0 (por ejemplo, una pieza de regalo); la devolución completa no.
export function refundTotalError(items: MovementFormItem[]): string | undefined {
  const total = refundTotalCents(items);
  if (total === null) return undefined;   // el error ya se muestra en el renglón
  if (total <= 0) return 'El reembolso debe ser mayor a $0.';
  if (total > MAX_CENTS) return 'El total es demasiado alto.';
  return undefined;
}

export function hasErrors(items: MovementFormItem[], kind: MovementKind): boolean {
  if (items.length === 0) return true;
  if (items.some((item) => quantityError(item, kind, true))) return true;
  if (!isRefund(kind)) return false;
  return items.some((item) => refundError(item, true)) || Boolean(refundTotalError(items));
}

export function toMovementInput(kind: MovementKind, items: MovementFormItem[], occurredAt: string | null): CreateMovementInput {
  const movementItems: CreateMovementItemInput[] = items.map((item) => ({
    productId: item.product.id,
    quantity: quantityOf(item),
    lineTotalCents: isRefund(kind) ? parsePesos(item.refund) ?? 0 : 0,
  }));
  const base = { items: movementItems, ...(occurredAt ? { ocurredAt: new Date(occurredAt).toISOString() } : {}) };
  if (kind === 'ADJUSTMENT_IN' || kind === 'ADJUSTMENT_OUT') {
    return { type: 'ADJUSTMENT', direction: kind === 'ADJUSTMENT_IN' ? 'IN' : 'OUT', ...base };
  }
  return { type: kind, ...base };
}
