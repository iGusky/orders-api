import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

// Confirmación breve abajo de la pantalla (docs/styles.md, 6.9).
export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(onDismiss, duration);
    return () => clearTimeout(timeout);
  }, [message, onDismiss, duration]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-28 z-50 flex justify-center md:bottom-8">
      {message && (
        <p className="flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-surface shadow-float transition-transform duration-200 ease-out starting:translate-y-4">
          <Check className="size-5" aria-hidden />
          {message}
        </p>
      )}
    </div>
  );
}
