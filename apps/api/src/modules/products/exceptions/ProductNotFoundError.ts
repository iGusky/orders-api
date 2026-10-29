import { DomainError } from "../../../common/exceptions/DomainError.js";
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js";

export class ProductNotFoundError extends DomainError 
{
    readonly code = DomainErrorCode.ProductNotFound
    constructor(public readonly id: string) {
        super(`No se ha encontrado el producto con ID ${id}.` )
    }
}