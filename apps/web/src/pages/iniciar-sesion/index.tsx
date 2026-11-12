import { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Clock, Loader2, Store } from 'lucide-react';
import { SessionNotSavedError, useAuth } from '../../auth/AuthContext';
import type { SignInLocationState } from '../../auth/RequireAuth';
import { ErrorPanel } from '../../components/ErrorPanel';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AppFooter } from '../../components/AppFooter';
import { getDomainError } from '../../services/api';
import { failedMessage } from '../../utils/requestErrors';

function signInErrorMessage(error: unknown): string {
  if (error instanceof SessionNotSavedError) {
    return 'Google confirmó tu cuenta, pero el navegador no guardó la sesión. Revisa que no esté bloqueando cookies e inténtalo otra vez.';
  }
  switch (getDomainError(error)?.errorCode) {
    case 'USER_INFO_NOT_FOUND_ON_GOOGLE':
      return 'Tu cuenta de Google no comparte tu nombre o tu correo, y los necesitamos para crear tu cuenta. Agrégalos en tu perfil de Google o entra con otra cuenta.';
    case 'SESSION_NOT_FOUND':
      return 'Google no confirmó tu cuenta. Vuelve a tocar el botón para intentarlo otra vez.';
  }
  return failedMessage('No pudimos iniciar tu sesión.', error);
}

export function SignInPage() {
  const { state, signIn } = useAuth();
  const location = useLocation();
  const from = (location.state as SignInLocationState | null)?.from ?? '/';
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const expired = state.status === 'anonymous' && state.expired === true;

  const handleCredential = useCallback(
    async (credential: string) => {
      setSubmitting(true);
      setErrorMessage(null);
      try {
        await signIn(credential);
        // Al quedar authenticated, el <Navigate> de abajo lleva a la pantalla pedida.
      } catch (error) {
        setErrorMessage(signInErrorMessage(error));
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

        {expired && !errorMessage && (
          <p role="status" className="flex w-full gap-3 rounded-lg border border-line bg-surface p-4 text-left">
            <Clock className="size-6 shrink-0 text-ink-muted" aria-hidden />
            Tu sesión terminó. Entra otra vez para seguir donde te quedaste.
          </p>
        )}

        {submitting ? (
          <p className="flex min-h-touch items-center gap-2 font-semibold" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Entrando…
          </p>
        ) : (
          <GoogleSignInButton onCredential={handleCredential} />
        )}

        {errorMessage && (
          <div className="w-full text-left">
            <ErrorPanel message={errorMessage} />
          </div>
        )}
      </section>

      <AppFooter />
    </main>
  );
}
