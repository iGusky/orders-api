import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";
import {Type} from 'class-transformer'
import { MAX_POSTGRES_POSITIVE_INTEGER } from "../../../common/constants/index.js";

export class ProductsIndexParamsDto {
    @IsOptional()
    @IsString()
    search: string;

    @IsInt()
    @IsPositive()
    @Min(1)
    @Max(500)
    @Type(() => Number)
    perPage: number;


    @IsInt()
    @IsPositive()
    @Min(1)
    @Max(MAX_POSTGRES_POSITIVE_INTEGER)
    @Type(() => Number)
    page: number;

    constructor(search: string, page: number, perPage: number) {
        this.page = page
        this.search = search
        this.perPage = perPage
    }
}