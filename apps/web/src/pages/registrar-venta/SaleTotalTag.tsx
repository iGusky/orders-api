import { formatCents } from '../../utils/money';

interface SaleTotalTagProps {
  pieces: number;
  productCount: number;
  listCents: number;
  totalCents: number | null;   // null si algún importe editado no es válido
  error?: string;
}

// Etiqueta kraft (docs/styles.md, 6.6): resume la venta. El total es la suma de los importes de cada producto.
export function SaleTotalTag({ pieces, productCount, listCents, totalCents, error }: SaleTotalTagProps) {
  const difference = totalCents !== null ? totalCents - listCents : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-kraft p-5 text-ink" aria-live="polite">
      <p className="flex items-center gap-3">
        <span className="size-3 shrink-0 rounded-full border border-line bg-background" aria-hidden />
        <span className="tabular">
          {pieces} {pieces === 1 ? 'pieza' : 'piezas'} de {productCount} {productCount === 1 ? 'producto' : 'productos'}
        </span>
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-kraft-ink">Total de la venta</span>
        <span className="tabular font-display text-amount">{totalCents !== null ? formatCents(totalCents) : '—'}</span>
      </div>

      <p className="tabular text-sm text-kraft-ink">
        {error ??
          (totalCents === null
            ? 'Corrige el importe marcado para ver el total.'
            : `Precio de lista: ${formatCents(listCents)}${
                difference < 0 ? `. Descuento de ${formatCents(-difference)}` : difference > 0 ? `. ${formatCents(difference)} más que el precio de lista` : ''
              }`)}
      </p>
      <p className="text-sm text-kraft-ink">Para aplicar un descuento, cambia el importe de cada producto.</p>
    </div>
  );
}
