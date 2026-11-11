import { DomainError } from "../../../common/exceptions/DomainError.js";
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js";

export class UserDontHaveStore extends DomainError 
{
    readonly code = DomainErrorCode.StoreRequiredError
    constructor() {
        super(`El usuario no tiene una tienda para realizar esta operación.` )
    }
}