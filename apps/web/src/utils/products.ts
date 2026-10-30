// A partir de cuántas unidades se avisa que queda poco. Ajustable.
export const LOW_STOCK_THRESHOLD = 3;

export type StockStatus = 'out' | 'low' | 'ok';

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}
