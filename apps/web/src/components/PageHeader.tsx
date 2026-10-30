import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  children?: ReactNode;   // texto secundario bajo el título
  action?: ReactNode;     // acción junto al título (en iPad)
}

export function PageHeader({ title, backTo = '/', children, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1 pt-3">
      <NavLink
        to={backTo}
        aria-label="Volver"
        className="-ml-3 grid size-touch place-items-center rounded-full text-ink active:bg-primary-soft"
      >
        <ChevronLeft className="size-6" aria-hidden />
      </NavLink>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl">{title}</h1>
          {children && <p className="text-sm text-ink-muted">{children}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
