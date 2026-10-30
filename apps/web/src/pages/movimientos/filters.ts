import type { MovementDirection, MovementFilters, MovementType } from '../../types/movement';
import { MOVEMENT_TYPE_META } from '../../utils/movements';

// Filtros de la pantalla de movimientos. Viven en la URL con nombres y valores en español:
// ?tipo=ajuste&direccion=salida&desde=2026-10-01&hasta=2026-10-15
export interface Filters {
  type: MovementType | null;
  direction: MovementDirection | null;  // solo con type ADJUSTMENT
  from: string;                         // YYYY-MM-DD o ''
  to: string;                           // YYYY-MM-DD o ''
}

export const EMPTY_FILTERS: Filters = { type: null, direction: null, from: '', to: '' };

export const FILTER_PARAMS = ['tipo', 'direccion', 'desde', 'hasta'] as const;

const TYPE_SLUGS: Record<MovementType, string> = {
  SALE: 'venta',
  RESTOCK: 'reabastecimiento',
  RETURN: 'devolucion',
  SHRINKAGE: 'merma',
  ADJUSTMENT: 'ajuste',
};

const DIRECTION_SLUGS: Record<MovementDirection, string> = { IN: 'entrada', OUT: 'salida' };

export const DIRECTION_LABELS: Record<MovementDirection, string> = { IN: 'Entrada', OUT: 'Salida' };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function fromSlug<T extends string>(slugs: Record<T, string>, value: string | null): T | null {
  const match = Object.entries(slugs).find(([, slug]) => slug === value);
  return match ? (match[0] as T) : null;
}

function isValidDate(value: string | null): value is string {
  return value !== null && DATE_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

// Fecha de hoy en la zona horaria del dispositivo, como la usa <input type="date">
export function todayInputValue(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Un rango a medias o al revés en la URL se ignora: las dos fechas van juntas.
export function parseFilters(params: URLSearchParams): Filters {
  const type = fromSlug(TYPE_SLUGS, params.get('tipo'));
  const direction = type === 'ADJUSTMENT' ? fromSlug(DIRECTION_SLUGS, params.get('direccion')) : null;
  const from = params.get('desde');
  const to = params.get('hasta');
  const validRange = isValidDate(from) && isValidDate(to) && from <= to;
  return { type, direction, from: validRange ? from : '', to: validRange ? to : '' };
}

export function filtersToParams(filters: Filters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.type) params.tipo = TYPE_SLUGS[filters.type];
  if (filters.type === 'ADJUSTMENT' && filters.direction) params.direccion = DIRECTION_SLUGS[filters.direction];
  if (filters.from && filters.to) {
    params.desde = filters.from;
    params.hasta = filters.to;
  }
  return params;
}

// El rango cubre los días completos en la hora local: desde las 00:00 del inicio hasta las 23:59:59.999 del fin.
export function toApiFilters(filters: Filters): MovementFilters {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.type === 'ADJUSTMENT' && filters.direction ? { direction: filters.direction } : {}),
    ...(filters.from && filters.to
      ? {
          dateStart: new Date(`${filters.from}T00:00:00`).toISOString(),
          dateEnd: new Date(`${filters.to}T23:59:59.999`).toISOString(),
        }
      : {}),
  };
}

export function filtersKey(filters: Filters): string {
  return [filters.type ?? '', filters.direction ?? '', filters.from, filters.to].join('|');
}

export function hasFilters(filters: Filters): boolean {
  return filters.type !== null || filters.from !== '';
}

export interface DateRangeErrors {
  from?: string;
  to?: string;
}

export function dateRangeErrors({ from, to }: Pick<Filters, 'from' | 'to'>, today = todayInputValue()): DateRangeErrors {
  const errors: DateRangeErrors = {};
  if (from && !to) errors.to = 'Elige también la fecha de fin.';
  if (to && !from) errors.from = 'Elige también la fecha de inicio.';
  if (from && from > today) errors.from = 'La fecha de inicio no puede ser después de hoy.';
  if (to && to > today) errors.to = 'La fecha de fin no puede ser después de hoy.';
  if (from && to && from > to) errors.to = 'La fecha de fin no puede ser antes de la de inicio.';
  return errors;
}

export function typeFilterLabel(filters: Filters): string | null {
  if (!filters.type) return null;
  if (filters.type !== 'ADJUSTMENT' || !filters.direction) return MOVEMENT_TYPE_META[filters.type].label;
  return filters.direction === 'IN' ? 'Ajuste de entrada' : 'Ajuste de salida';
}

const dayMonthFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const dayMonthYearFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// "29 oct", "1–15 oct", "28 sep – 3 oct" o, si alguna fecha es de otro año, "28 dic 2025 – 3 ene 2026"
export function dateFilterLabel({ from, to }: Filters, now = new Date()): string | null {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const sameYear = start.getFullYear() === now.getFullYear() && end.getFullYear() === now.getFullYear();
  const formatter = sameYear ? dayMonthFormatter : dayMonthYearFormatter;
  if (from === to) return formatter.format(start);
  if (sameYear && start.getMonth() === end.getMonth()) return `${start.getDate()}–${formatter.format(end)}`;
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
