import { DomainError } from "../../../common/exceptions/DomainError.js";
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js";

export class UserAlreadyHasStore extends DomainError 
{
    readonly code = DomainErrorCode.UserAlreadyHasStore
    constructor() {
        super(`El usuario ya tiene una tienda creada.` )
    }
}