import { DomainError } from './DomainError.js';
import { DomainErrorCode } from './DomainErrorCodes.js';

export class RoleNotAllowedError extends DomainError {
  readonly code = DomainErrorCode.RoleNotAllowed;
  constructor() {
    super(`Tu rol en esta tienda no permite realizar esta operación.`);
  }
}
