import { isAxiosError } from 'axios';
import type { ApiErrorBody, DomainErrorBody } from '../../types/api-error';

export function getApiErrorBody(error: unknown): ApiErrorBody | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) return undefined;
  return error.response?.data;
}

// Devuelve el body solo si es un error de dominio. Decide con errorCode, nunca con el texto de message.
export function getDomainError(error: unknown): DomainErrorBody | undefined {
  const body = getApiErrorBody(error);
  return body && 'errorCode' in body ? body : undefined;
}
