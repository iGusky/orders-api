import { getRequestFailure } from '../services/api';

// Qué hacer cuando una petición falla por algo que no es culpa de los datos (sin red o error del servidor).
// Va después de la frase que dice qué no se pudo hacer: "No se pudo guardar el producto. Revisa tu conexión…".
export function retryHint(error: unknown): string {
  switch (getRequestFailure(error)) {
    case 'offline':
      return 'Revisa tu conexión e inténtalo otra vez.';
    case 'server':
      return 'El servidor tuvo un problema. Inténtalo otra vez en un momento.';
    default:
      return 'Inténtalo otra vez.';
  }
}

export function failedMessage(what: string, error: unknown): string {
  return `${what} ${retryHint(error)}`;
}
