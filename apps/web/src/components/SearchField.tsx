import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;   // se llama después de que el usuario deja de escribir
  label: string;
  placeholder?: string;
  delay?: number;
}

export function SearchField({ value, onChange, label, placeholder, delay = 300 }: SearchFieldProps) {
  const [text, setText] = useState(value);

  // Si el valor cambia desde fuera (por ejemplo, con el botón atrás), se refleja en el campo.
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timeout = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(timeout);
  }, [text, value, onChange, delay]);

  return (
    <label className="flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface pl-4 focus-within:outline-3 focus-within:outline-primary">
      <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-2 outline-none [&::-webkit-search-cancel-button]:hidden"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
      {text && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          className="grid size-touch shrink-0 place-items-center rounded-full active:bg-primary-soft"
          onClick={() => {
            setText('');
            onChange('');
          }}
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </label>
  );
}
