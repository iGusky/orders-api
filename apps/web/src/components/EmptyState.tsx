import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  children?: ReactNode;   // acción para salir del estado vacío
}

export function EmptyState({ icon: Icon, message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Icon className="size-10 text-ink-muted" aria-hidden />
      <p>{message}</p>
      {children}
    </div>
  );
}
