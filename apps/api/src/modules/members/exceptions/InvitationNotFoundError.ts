import { DomainError } from '../../../common/exceptions/DomainError.js';
import { DomainErrorCode } from '../../../common/exceptions/DomainErrorCodes.js';

export class InvitationNotFoundError extends DomainError {
  readonly code = DomainErrorCode.InvitationNotFound;
  constructor() {
    super(`La invitación no existe o ya no está pendiente.`);
  }
}
