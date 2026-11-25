import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class CannotRemoveOwnerError extends DomainError {
  readonly code = DomainErrorCode.CannotRemoveOwner;
  constructor() {
    super(`El dueño no se puede quitar de su tienda.`);
  }
}
