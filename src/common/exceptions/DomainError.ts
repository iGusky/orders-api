import { DomainErrorCode } from "./DomainErrorCodes.js";

export abstract class DomainError extends Error {
    abstract readonly code: DomainErrorCode
    constructor(message: string) {
        super(message)
        this.name = new.target.name
    }
}