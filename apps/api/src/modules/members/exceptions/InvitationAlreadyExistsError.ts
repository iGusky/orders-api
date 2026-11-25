import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class InvitationAlreadyExistsError extends DomainError {
  readonly code = DomainErrorCode.InvitationAlreadyExists;
  constructor() {
    super(`Ya hay una invitación pendiente para ese correo.`);
  }
}
