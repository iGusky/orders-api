import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class MemberNotFoundError extends DomainError {
  readonly code = DomainErrorCode.MemberNotFound;
  constructor() {
    super(`Esa persona no pertenece a la tienda.`);
  }
}
