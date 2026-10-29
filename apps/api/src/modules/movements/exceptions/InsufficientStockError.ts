import { Product } from "../../../../generated/prisma/client.js";
import { DomainError } from "../../../common/exceptions/DomainError.js";
import { DomainErrorCode } from "../../../common/exceptions/DomainErrorCodes.js";

export class InsufficientStockError extends DomainError {
    readonly code = DomainErrorCode.InsufficientStock
    
    constructor(
        public readonly productId: string,
        public readonly productName: string, 
        public readonly quantityRequired: number, 
        public readonly currentStock: number
    ) {
        super(`No hay stock suficiente del producto: ${productName}`)
    }
}