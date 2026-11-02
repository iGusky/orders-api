import { IsDate, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { MovementDirectionType, MovementType } from "../../../../generated/prisma/enums.js";
import { CreateMovementItemDto } from "./CreateMovementItemDto.js";
import { Type } from "class-transformer";

export class CreateMovementDto {

    @IsString()
    @IsNotEmpty()
    @IsEnum(MovementType)
    type!: MovementType
    
    @ValidateIf(o => o.type == MovementType.ADJUSTMENT)
    @IsString()
    @IsNotEmpty()
    @IsEnum(MovementDirectionType)
    direction!: MovementDirectionType

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMovementItemDto)
    items!: CreateMovementItemDto[]

    @IsISO8601()
    @IsOptional()
    occurredAt!: Date
}