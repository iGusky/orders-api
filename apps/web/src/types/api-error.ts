export const DOMAIN_ERROR_CODES = ['PRODUCT_NOT_FOUND', 'INSUFFICIENT_STOCK'] as const;
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
