import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const buttonClasses =
  'flex h-touch items-center gap-1 rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft disabled:opacity-50';

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      <button type="button" className={buttonClasses} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-5" aria-hidden />
        Anterior
      </button>
      <p className="tabular text-sm text-ink-muted" aria-current="page">
        Página {page} de {totalPages}
      </p>
      <button type="button" className={buttonClasses} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </nav>
  );
}
