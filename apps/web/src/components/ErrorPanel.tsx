import { CircleAlert } from 'lucide-react';

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg bg-danger-soft p-4">
      <CircleAlert className="size-6 shrink-0 text-danger" aria-hidden />
      <div className="flex flex-col gap-3">
        <p>{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="h-touch w-fit rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
