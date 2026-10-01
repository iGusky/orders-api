import { MAX_POSTGRES_POSITIVE_INTEGER } from '../../../common/constants/index.js';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { MIN_PRODUCT_PRICE_CENTS } from '../constants/index.js';

export class CreateProductDto {
  
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @Max(MAX_POSTGRES_POSITIVE_INTEGER)
  @Min(MIN_PRODUCT_PRICE_CENTS)
  priceCents: number;


  constructor(name: string, description: string, priceCents: number) {
    this.description = description;
    this.name = name;
    this.priceCents = priceCents;
  }
}
