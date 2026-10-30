// La API trabaja en centavos enteros (D4, D15). La conversión a pesos solo ocurre en la UI.

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// "45.50" | 45.5 -> 4550. Redondea al entero más cercano. Devuelve NaN si la entrada no es un número.
export function pesosToCents(pesos: string | number): number {
  const value = typeof pesos === 'number' ? pesos : Number(pesos.replace(/[$,\s]/g, ''));
  return Math.round(value * 100);
}

// 4550 -> "$45.50"
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
