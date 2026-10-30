import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Hoja inferior en celular; diálogo centrado en iPad (docs/styles.md, 6.7).
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-xl bg-surface pb-safe shadow-float transition-transform duration-200 ease-out starting:translate-y-full md:rounded-lg md:starting:translate-y-8"
      >
        <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-4 pt-2">
          <h2 id={titleId} className="text-xl">{title}</h2>
          <button type="button" className="grid size-touch place-items-center rounded-full active:bg-primary-soft" aria-label="Cerrar" onClick={onClose}>
            <X className="size-6" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pt-2 pb-4">{children}</div>
      </div>
    </div>
  );
}
