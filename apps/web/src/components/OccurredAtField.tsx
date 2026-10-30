// Cuándo ocurrió el movimiento (D8): el registro puede hacerse horas después.

interface OccurredAtFieldProps {
  noun: string;                         // con artículo: "la venta", "el ajuste"
  value: string | null;                 // null = ahora; si no, valor de <input type="datetime-local">
  onChange: (value: string | null) => void;
  error?: string;
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function occurredAtError(value: string | null): string | undefined {
  if (value === null) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Elige la fecha y la hora.';
  if (date.getTime() > Date.now()) return 'La fecha no puede ser en el futuro.';
  return undefined;
}

const optionClasses = (selected: boolean) =>
  `min-h-touch flex-1 rounded-full border px-4 font-semibold ${selected ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface'}`;

export function OccurredAtField({ noun, value, onChange, error }: OccurredAtFieldProps) {
  const custom = value !== null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">¿Cuándo fue {noun}?</legend>
      <div className="flex gap-2">
        <button type="button" aria-pressed={!custom} className={optionClasses(!custom)} onClick={() => onChange(null)}>
          Ahora
        </button>
        <button type="button" aria-pressed={custom} className={optionClasses(custom)} onClick={() => onChange(value ?? toLocalInputValue(new Date()))}>
          Otro momento
        </button>
      </div>
      {custom && (
        <label className="flex flex-col gap-1">
          <span className="sr-only">Fecha y hora de {noun}</span>
          <input
            type="datetime-local"
            className={`min-h-touch rounded-md border bg-surface px-4 ${error ? 'border-danger' : 'border-line'}`}
            value={value}
            max={toLocalInputValue(new Date())}
            aria-invalid={Boolean(error)}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <span className="text-sm text-danger">{error}</span>}
        </label>
      )}
    </fieldset>
  );
}
