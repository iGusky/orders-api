import { DomainError } from "../../../common/exceptions/DomainError.js"
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js"

export class SessionNotFoundError extends DomainError 
{
    readonly code = DomainErrorCode.SessionNotFound
    constructor() {
        super(`No se ha encontrado una sesíon válida` )
    }
}