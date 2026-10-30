import { IsEnum, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsPositive, IsString, Max, Min, ValidateIf } from "class-validator";
import {Type} from 'class-transformer'
import { MAX_POSTGRES_POSITIVE_INTEGER } from "../../../common/constants/index.js";
import { MovementDirectionType, MovementType } from "../../../../generated/prisma/enums.js";

export class IndexMovementsPaginated {

    @IsString()
    @IsOptional()
    @IsEnum(MovementType)
    type!: MovementType

    @ValidateIf(o => o.type == MovementType.ADJUSTMENT)
    @IsOptional()
    @IsString()
    @IsEnum(MovementDirectionType)
    direction!: MovementDirectionType

    @ValidateIf(o => o.dateEnd != null)
    @IsOptional()
    @IsISO8601()
    dateStart!: Date

    @ValidateIf(o => o.dateStart != null)
    @IsOptional()
    @IsISO8601()
    dateEnd!: Date

    @IsInt()
    @IsPositive()
    @Min(1)
    @Max(500)
    @Type(() => Number)
    perPage!: number;


    @IsInt()
    @IsPositive()
    @Min(1)
    @Max(MAX_POSTGRES_POSITIVE_INTEGER)
    @Type(() => Number)
    page!: number;
}