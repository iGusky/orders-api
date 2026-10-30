import type { CreateMovementItemInput } from '../../types/movement';
import type { Product } from '../../types/product';
import { MAX_CENTS, parsePesos } from '../../utils/money';

export interface SaleItem {
  product: Product;
  quantity: string;          // texto del campo; se valida con quantityOf/itemError
  lineTotal: string | null;  // importe editado en pesos; null = se usa el precio de lista
}

// Cantidad válida o 0 si el campo está vacío o es inválido (no suma al total mientras se escribe).
export function quantityOf(item: SaleItem): number {
  const quantity = Number(item.quantity);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

export function listSubtotalCents(item: SaleItem): number {
  return item.product.priceCents * quantityOf(item);
}

// Importe del renglón (D5): el editado, o el de lista si no se cambió. null si el texto editado no es válido.
export function lineTotalCents(item: SaleItem): number | null {
  return item.lineTotal === null ? listSubtotalCents(item) : parsePesos(item.lineTotal);
}

// Σ lineTotalCents (I3). null si algún importe editado no es válido.
export function saleTotalCents(items: SaleItem[]): number | null {
  let total = 0;
  for (const item of items) {
    const line = lineTotalCents(item);
    if (line === null) return null;
    total += line;
  }
  return total;
}

export function listTotalCents(items: SaleItem[]): number {
  return items.reduce((sum, item) => sum + listSubtotalCents(item), 0);
}

export function quantityError(item: SaleItem, submitted: boolean): string | undefined {
  const { quantity, product } = item;
  if (quantity.trim() === '') return submitted ? 'Escribe la cantidad.' : undefined;
  const value = Number(quantity);
  if (!Number.isInteger(value)) return 'Usa un número entero, sin decimales.';
  if (value < 1) return 'Vende al menos 1 unidad.';
  if (product.stock === 0) return 'Este producto está agotado.';
  if (value > product.stock) return `Solo hay ${product.stock} en stock.`;
  return undefined;
}

// Un renglón puede valer $0 (por ejemplo, una pieza de regalo en una promoción); la venta completa no.
export function lineTotalError(item: SaleItem): string | undefined {
  if (item.lineTotal === null) return undefined;
  const cents = parsePesos(item.lineTotal);
  if (cents === null) return 'Escribe el importe con números, por ejemplo 40 o 39.50.';
  if (cents > MAX_CENTS) return 'El importe es demasiado alto.';
  return undefined;
}

export function saleTotalError(items: SaleItem[]): string | undefined {
  const total = saleTotalCents(items);
  if (total === null) return undefined;   // el error ya se muestra en el renglón
  if (total <= 0) return 'El total de la venta debe ser mayor a $0.';
  if (total > MAX_CENTS) return 'El total es demasiado alto.';
  return undefined;
}

export function toMovementItems(items: SaleItem[]): CreateMovementItemInput[] {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: quantityOf(item),
    lineTotalCents: lineTotalCents(item) ?? 0,
  }));
}
