import { IsIn, IsInt, IsNotEmpty, IsPositive, IsUUID } from "class-validator"

export class CreateMovementItemDto {
    @IsNotEmpty()
    @IsUUID()
    productId!: string

    @IsPositive()
    @IsInt()
    quantity!: number

    @IsPositive()
    @IsInt()
    lineTotalCents!: number
}