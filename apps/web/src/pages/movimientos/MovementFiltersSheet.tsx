import { useState, type ReactNode } from 'react';
import { CircleAlert, ListFilter } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { MOVEMENT_DIRECTIONS, MOVEMENT_TYPES, type MovementDirection, type MovementType } from '../../types/movement';
import { MOVEMENT_TYPE_META } from '../../utils/movements';
import { DIRECTION_LABELS, EMPTY_FILTERS, dateRangeErrors, todayInputValue, type Filters } from './filters';

interface MovementFiltersSheetProps {
  open: boolean;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

const optionClasses = (selected: boolean) =>
  `flex min-h-touch items-center gap-2 rounded-full border px-4 font-semibold ${selected ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface active:bg-primary-soft'}`;

interface OptionProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function Option({ selected, onSelect, children }: OptionProps) {
  return (
    <button type="button" aria-pressed={selected} className={optionClasses(selected)} onClick={onSelect}>
      {children}
    </button>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  min?: string;
  max: string;
  error?: string;
  onChange: (value: string) => void;
}

function DateField({ label, value, min, max, error, onChange }: DateFieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="date"
        className={`min-h-touch w-full min-w-0 rounded-md border bg-surface px-3 text-base ${error ? 'border-danger' : 'border-line'}`}
        value={value}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <span className="flex items-start gap-1 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </span>
      )}
    </label>
  );
}

// El contenido se monta al abrir, así que el borrador arranca de los filtros vigentes.
function FiltersForm({ filters, onApply }: Pick<MovementFiltersSheetProps, 'filters' | 'onApply'>) {
  const [draft, setDraft] = useState(filters);
  const [submitted, setSubmitted] = useState(false);
  const today = todayInputValue();
  const errors = dateRangeErrors(draft, today);
  const visibleErrors = submitted ? errors : {};

  const selectType = (type: MovementType | null) => setDraft((current) => ({ ...current, type, direction: null }));
  const selectDirection = (direction: MovementDirection | null) => setDraft((current) => ({ ...current, direction }));

  const apply = () => {
    setSubmitted(true);
    if (errors.from || errors.to) return;
    onApply(draft);
  };

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          <Option selected={draft.type === null} onSelect={() => selectType(null)}>Todos</Option>
          {MOVEMENT_TYPES.map((type) => {
            const { label, icon: Icon } = MOVEMENT_TYPE_META[type];
            return (
              <Option key={type} selected={draft.type === type} onSelect={() => selectType(type)}>
                <Icon className="size-5" aria-hidden />
                {label}
              </Option>
            );
          })}
        </div>
      </fieldset>

      {draft.type === 'ADJUSTMENT' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Dirección del ajuste</legend>
          <div className="flex gap-2 *:flex-1 *:justify-center">
            <Option selected={draft.direction === null} onSelect={() => selectDirection(null)}>Ambas</Option>
            {MOVEMENT_DIRECTIONS.map((direction) => (
              <Option key={direction} selected={draft.direction === direction} onSelect={() => selectDirection(direction)}>
                {DIRECTION_LABELS[direction]}
              </Option>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Fechas</legend>
        <p className="text-sm text-ink-muted">Elige las dos para ver los movimientos de esos días.</p>
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label="Desde"
            value={draft.from}
            max={draft.to && draft.to < today ? draft.to : today}
            error={visibleErrors.from}
            onChange={(from) => setDraft((current) => ({ ...current, from }))}
          />
          <DateField
            label="Hasta"
            value={draft.to}
            min={draft.from || undefined}
            max={today}
            error={visibleErrors.to}
            onChange={(to) => setDraft((current) => ({ ...current, to }))}
          />
        </div>
        {(draft.from || draft.to) && (
          <button
            type="button"
            className="self-start rounded-md px-2 py-3 text-sm font-semibold text-primary active:bg-primary-soft"
            onClick={() => setDraft((current) => ({ ...current, from: '', to: '' }))}
          >
            Borrar fechas
          </button>
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="h-touch w-full rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft md:w-auto"
          onClick={() => onApply(EMPTY_FILTERS)}
        >
          Quitar filtros
        </button>
        <button
          type="submit"
          className="flex h-touch-lg w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed md:w-auto"
        >
          <ListFilter className="size-5" aria-hidden />
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

export function MovementFiltersSheet({ open, filters, onApply, onClose }: MovementFiltersSheetProps) {
  return (
    <BottomSheet open={open} title="Filtrar movimientos" onClose={onClose}>
      <FiltersForm filters={filters} onApply={onApply} />
    </BottomSheet>
  );
}
