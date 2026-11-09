import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { clearGoogleSignIn, setupGoogleSignIn } from '../services/googleIdentity';
import { ErrorPanel } from './ErrorPanel';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
}

// Google dibuja el botón dentro de un iframe; su ancho va de 200 a 400 px.
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onCredential);
  const { theme } = useTheme();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    handlerRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    setupGoogleSignIn((credential) => handlerRef.current(credential))
      .then((id) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, container.offsetWidth));
        id.renderButton(container, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width,
          locale: 'es-419',
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [theme, attempt]);

  useEffect(() => clearGoogleSignIn, []);

  const retry = () => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {status === 'loading' && (
        <Loader2 className="size-6 animate-spin text-ink-muted" aria-label="Cargando el botón de Google" />
      )}
      {status === 'error' && (
        <ErrorPanel message="No pudimos cargar el botón de Google. Revisa tu conexión." onRetry={retry} />
      )}
      {/* min-h-touch reserva el alto del botón (44 px de Google + margen) para que la pantalla no salte. */}
      <div ref={containerRef} className="flex min-h-touch w-full max-w-100 justify-center" hidden={status === 'error'} />
    </div>
  );
}
