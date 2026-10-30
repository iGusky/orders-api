import { CircleAlert } from 'lucide-react';

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <span id={id} className="flex items-center gap-1 text-sm text-danger">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {message}
    </span>
  );
}
