import { IsIn, IsInt, IsNotEmpty, IsPositive, IsUUID, Max, Min } from "class-validator"
import { MAX_POSTGRES_POSITIVE_INTEGER } from "../../../common/constants/index.js"

export class CreateMovementItemDto {
    @IsNotEmpty()
    @IsUUID()
    productId!: string

    @IsInt()
    @Min(1)
    @Max(MAX_POSTGRES_POSITIVE_INTEGER)
    quantity!: number

    @IsInt()
    @Min(0)
    @Max(MAX_POSTGRES_POSITIVE_INTEGER)
    lineTotalCents!: number
}