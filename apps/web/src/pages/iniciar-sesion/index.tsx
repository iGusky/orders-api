import { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2, Store } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import type { SignInLocationState } from '../../auth/RequireAuth';
import { ErrorPanel } from '../../components/ErrorPanel';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { ThemeToggle } from '../../components/ThemeToggle';

export function SignInPage() {
  const { state, signIn } = useAuth();
  const location = useLocation();
  const from = (location.state as SignInLocationState | null)?.from ?? '/';
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCredential = useCallback(
    async (credential: string) => {
      setSubmitting(true);
      setFailed(false);
      try {
        await signIn(credential);
        // Al quedar authenticated, el <Navigate> de abajo lleva a la pantalla pedida.
      } catch {
        setFailed(true);
      } finally {
        setSubmitting(false);
      }
    },
    [signIn],
  );

  if (state.status === 'authenticated') return <Navigate to={from} replace />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-safe pb-safe">
      <header className="mt-8 flex justify-end">
        <ThemeToggle />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 pb-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <Store className="size-10 text-ink-muted" aria-hidden />
          <h1 className="text-2xl">Registro de ventas</h1>
          <p className="text-ink-muted">Entra con tu cuenta de Google para registrar ventas y ver tu inventario.</p>
        </div>

        {submitting ? (
          <p className="flex min-h-touch items-center gap-2 font-semibold" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Entrando…
          </p>
        ) : (
          <GoogleSignInButton onCredential={handleCredential} />
        )}

        {failed && (
          <div className="w-full text-left">
            <ErrorPanel message="No pudimos iniciar tu sesión. Inténtalo otra vez." />
          </div>
        )}
      </section>
    </main>
  );
}
