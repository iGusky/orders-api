import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainError } from '../exceptions/DomainError.js';
import { Response } from 'express';
import { DomainErrorCode } from '../exceptions/DomainErrorCodes.js';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = domainErrorToHttpCode[exception.code];
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      errorCode: exception.code,
    });
  }
}

const domainErrorToHttpCode: Record<DomainErrorCode, HttpStatus> = {
  [DomainErrorCode.ProductNotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.InsufficientStock]: HttpStatus.CONFLICT,
};