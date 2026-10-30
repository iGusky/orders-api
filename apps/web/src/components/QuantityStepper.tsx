import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  id: string;
  value: string;                 // texto, para permitir borrar y escribir libremente
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  invalid?: boolean;
  describedBy?: string;
}

const stepButton =
  'grid size-touch-lg shrink-0 place-items-center rounded-full border border-line bg-surface active:bg-primary-soft disabled:opacity-50';

// Stepper de cantidad (docs/styles.md, 6.3): se toca para sumar o restar y el número también se puede escribir.
export function QuantityStepper({ id, value, onChange, min = 1, max = Number.MAX_SAFE_INTEGER, invalid, describedBy }: QuantityStepperProps) {
  const current = Number(value);
  const numeric = Number.isInteger(current) ? current : min - 1;

  const step = (delta: number) => onChange(String(Math.min(max, Math.max(min, numeric + delta))));

  return (
    <div className="flex items-center gap-3">
      <button type="button" className={stepButton} aria-label="Quitar una unidad" disabled={numeric <= min} onClick={() => step(-1)}>
        <Minus className="size-6" aria-hidden />
      </button>
      <input
        id={id}
        className={`tabular h-touch-lg w-28 rounded-md border bg-surface text-center text-xl font-semibold ${invalid ? 'border-danger' : 'border-line'}`}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={value}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, ''))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className={stepButton} aria-label="Agregar una unidad" disabled={numeric >= max} onClick={() => step(1)}>
        <Plus className="size-6" aria-hidden />
      </button>
    </div>
  );
}
