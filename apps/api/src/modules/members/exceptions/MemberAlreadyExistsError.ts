import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class MemberAlreadyExistsError extends DomainError {
  readonly code = DomainErrorCode.MemberAlreadyExists;
  constructor() {
    super(`Esa persona ya pertenece a la tienda.`);
  }
}
