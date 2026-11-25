import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class StoreNotSelectedError extends DomainError {
  readonly code = DomainErrorCode.StoreNotSelected;
  constructor() {
    super(`Falta indicar la tienda en el header X-Store-Id.`);
  }
}
