import { NavLink } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { AppFooter } from '../../components/AppFooter';

const linkClasses = 'font-semibold text-ink underline underline-offset-4';

// Pública a propósito: el enlace está en el pie de página, que también aparece en /iniciar-sesion.
// Por eso no usa PageHeader (necesita sesión y tienda activa).
export function CreditsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      <header className="flex flex-col gap-1 pt-3">
        <NavLink
          to="/"
          aria-label="Volver"
          className="-ml-3 grid size-touch place-items-center rounded-full text-ink active:bg-primary-soft"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </NavLink>
        <h1 className="text-xl md:text-2xl">Créditos</h1>
        <p className="text-sm text-ink-muted">Recursos de terceros que usa esta app.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Ícono de la app</h2>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
          <img src="/bag.png" alt="" width={32} height={32} className="size-8 shrink-0" />
          <p>
            <a
              href="https://www.flaticon.com/free-icons/commerce-and-shopping"
              title="commerce and shopping icons"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Commerce and shopping icons created by Corner Pixel - Flaticon
            </a>
          </p>
        </div>
      </section>

      <AppFooter />
    </main>
  );
}
