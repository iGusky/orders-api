// Las fechas llegan como ISO 8601 y se muestran en la zona horaria del dispositivo.

const timeFormatter = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const dayWithYearFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// "14:30"
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

// Clave única por día local, para agrupar
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// "Hoy", "Ayer", "Jueves, 29 de octubre" o, si es de otro año, "Jueves, 29 de octubre de 2025"
export function formatDay(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dayKey(iso) === dayKey(now.toISOString())) return 'Hoy';
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Ayer';

  const formatter = date.getFullYear() === now.getFullYear() ? dayFormatter : dayWithYearFormatter;
  const text = formatter.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
