import { Heart } from 'lucide-react';

const WEBSITE_URL = 'https://gushm.dev';
const GITHUB_URL = 'https://github.com/iGusky';

const linkClasses =
  'inline-flex min-h-touch items-center rounded-md px-3 font-semibold text-ink underline underline-offset-4 active:bg-primary-soft';

// Pie de página con el crédito del autor. Solo va en pantallas sin barra de acción fija (Inicio, Iniciar sesión,
// Registrar tienda): en las de captura la barra lo taparía y solo agregaría ruido.
export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto flex flex-col items-center gap-1 border-t border-line pt-4 pb-4 text-center text-sm text-ink-muted">
      <p className="flex items-center gap-1">
        Hecho con
        <Heart className="size-4 fill-current" aria-hidden />
        <span className="sr-only">amor</span>
        por Gus
      </p>
      <nav aria-label="Enlaces del autor" className="flex flex-wrap justify-center gap-3">
        <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className={linkClasses}>
          gushm.dev
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkClasses}>
          GitHub
        </a>
      </nav>
      <p>© {year} Gus HM. Todos los derechos reservados.</p>
    </footer>
  );
}
