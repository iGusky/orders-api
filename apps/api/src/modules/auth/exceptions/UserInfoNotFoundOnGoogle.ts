import { DomainError } from "../../../common/exceptions/DomainError.js"
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js"

export class UserInfoNotFoundOnGoogle extends DomainError
{
    readonly code = DomainErrorCode.UserInfoNotFoundOnGoogle
    constructor() {
        super(`El usuario no tiene nombre o correo en su perfíl de google,` )
    }
}