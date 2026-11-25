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
  [DomainErrorCode.SessionNotFound]: HttpStatus.UNAUTHORIZED,
  [DomainErrorCode.UserInfoNotFoundOnGoogle]: HttpStatus.UNAUTHORIZED,
  [DomainErrorCode.UserAlreadyHasStore]: HttpStatus.CONFLICT,
  [DomainErrorCode.StoreNotSelected]: HttpStatus.BAD_REQUEST,
  [DomainErrorCode.StoreNotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.RoleNotAllowed]: HttpStatus.FORBIDDEN,
  [DomainErrorCode.MemberAlreadyExists]: HttpStatus.CONFLICT,
  [DomainErrorCode.InvitationAlreadyExists]: HttpStatus.CONFLICT,
  [DomainErrorCode.MemberNotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.InvitationNotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.CannotRemoveOwner]: HttpStatus.CONFLICT,
};