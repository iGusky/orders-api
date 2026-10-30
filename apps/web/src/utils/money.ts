// La API trabaja en centavos enteros (D4, D15). La conversión a pesos solo ocurre en la UI.

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// Límite de las columnas Int de PostgreSQL (D15): un importe mayor la API lo rechaza.
export const MAX_CENTS = 2_147_483_647;

const PESOS_PATTERN = /^\d+(\.\d{1,2})?$/;

// "45.50" | 45.5 -> 4550. Redondea al entero más cercano. Devuelve NaN si la entrada no es un número.
export function pesosToCents(pesos: string | number): number {
  const value = typeof pesos === 'number' ? pesos : Number(pesos.replace(/[$,\s]/g, ''));
  return Math.round(value * 100);
}

// Valida lo que escribe el usuario: "$1,250.5" -> 125050. Devuelve null si no es un monto con hasta 2 decimales.
export function parsePesos(text: string): number | null {
  const normalized = text.replace(/[$,\s]/g, '');
  return PESOS_PATTERN.test(normalized) ? pesosToCents(normalized) : null;
}

// 4550 -> "$45.50"
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

// 4550 -> "45.50", para llenar un campo editable
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
