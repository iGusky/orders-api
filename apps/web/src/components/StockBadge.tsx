import { stockStatus } from '../utils/products';

export function StockBadge({ stock }: { stock: number }) {
  const status = stockStatus(stock);
  if (status === 'out') return <span className="rounded-sm bg-danger-soft px-2 text-sm whitespace-nowrap text-danger">Agotado</span>;
  if (status === 'low') return <span className="rounded-sm bg-kraft px-2 text-sm whitespace-nowrap text-kraft-ink">Quedan {stock}</span>;
  return null;
}
