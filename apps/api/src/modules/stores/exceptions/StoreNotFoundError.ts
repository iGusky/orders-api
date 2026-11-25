import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class StoreNotFoundError extends DomainError {
  readonly code = DomainErrorCode.StoreNotFound;
  constructor() {
    super(`La tienda no existe o no perteneces a ella.`);
  }
}
