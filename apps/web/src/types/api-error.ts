// Igual que DomainErrorCode de la API (common/exceptions/DomainErrorCodes.ts). Ver "Errores" en docs/api.md.
export const DOMAIN_ERROR_CODES = [
  'PRODUCT_NOT_FOUND',
  'INSUFFICIENT_STOCK',
  'SESSION_NOT_FOUND',
  'USER_INFO_NOT_FOUND_ON_GOOGLE',
  'USER_HAS_STORE',
  // Fase 3: ver "Empleados y tienda activa" en docs/api.md.
  'STORE_NOT_SELECTED',
  'STORE_NOT_FOUND',
  'ROLE_NOT_ALLOWED',
  'MEMBER_ALREADY_EXISTS',
  'INVITATION_ALREADY_EXISTS',
  'MEMBER_NOT_FOUND',
  'INVITATION_NOT_FOUND',
  'CANNOT_REMOVE_OWNER',
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
