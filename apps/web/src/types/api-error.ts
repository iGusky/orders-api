// Igual que DomainErrorCode de la API (common/exceptions/DomainErrorCodes.ts). Ver "Errores" en docs/api.md.
export const DOMAIN_ERROR_CODES = [
  'PRODUCT_NOT_FOUND',
  'INSUFFICIENT_STOCK',
  'SESSION_NOT_FOUND',
  'USER_INFO_NOT_FOUND_ON_GOOGLE',
  'USER_HAS_STORE',
  'USER_DONT_HAVE_STORE',
] as const;
export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

// Lanzado por DomainErrorFilter
export interface DomainErrorBody {
  statusCode: number;
  message: string;
  errorCode: DomainErrorCode;
}

// Lanzado por ValidationPipe de NestJS
export interface ValidationErrorBody {
  statusCode: 400;
  message: string[];
  error: string;
}

export type ApiErrorBody = DomainErrorBody | ValidationErrorBody;
