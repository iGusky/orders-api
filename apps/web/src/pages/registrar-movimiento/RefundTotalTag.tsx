import { formatCents } from '../../utils/money';

interface RefundTotalTagProps {
  pieces: number;
  productCount: number;
  totalCents: number | null;   // null mientras falte un importe o alguno no sea válido
  error?: string;
}

// Etiqueta kraft (docs/styles.md, 6.6): resume la devolución. El total es la suma de los reembolsos de cada producto.
export function RefundTotalTag({ pieces, productCount, totalCents, error }: RefundTotalTagProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-kraft p-5 text-ink" aria-live="polite">
      <p className="flex items-center gap-3">
        <span className="size-3 shrink-0 rounded-full border border-line bg-background" aria-hidden />
        <span className="tabular">
          {pieces} {pieces === 1 ? 'pieza' : 'piezas'} de {productCount} {productCount === 1 ? 'producto' : 'productos'}
        </span>
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-kraft-ink">Total reembolsado</span>
        <span className="tabular font-display text-amount">{totalCents !== null ? formatCents(totalCents) : '—'}</span>
      </div>

      {(error || totalCents === null) && (
        <p className="text-sm text-kraft-ink">{error ?? 'Escribe el reembolso de cada producto para ver el total.'}</p>
      )}
    </div>
  );
}
