import { isAxiosError } from 'axios';
import type { ApiErrorBody, DomainErrorBody } from '../../types/api-error';

export function getApiErrorBody(error: unknown): ApiErrorBody | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) return undefined;
  return error.response?.data;
}

// Devuelve el body solo si es un error de dominio. Decide con errorCode, nunca con el texto de message.
export function getDomainError(error: unknown): DomainErrorBody | undefined {
  const body = getApiErrorBody(error);
  return body && typeof body === 'object' && 'errorCode' in body ? body : undefined;
}

// Por qué falló una petición, para que la UI le diga a la persona qué hacer:
// - offline: no hubo respuesta (sin internet o la API no está corriendo). Revisar la conexión.
// - server: la API respondió 5xx. No es culpa de la persona; reintentar en un momento.
// - rejected: la API respondió 4xx. Cada pantalla lo explica según el errorCode o el status.
// - unknown: no es un error de red (un bug del frontend, por ejemplo).
export type RequestFailure = 'offline' | 'server' | 'rejected' | 'unknown';

export function getRequestFailure(error: unknown): RequestFailure {
  if (!isAxiosError(error)) return 'unknown';
  const status = error.response?.status;
  if (status === undefined) return 'offline';
  return status >= 500 ? 'server' : 'rejected';
}
