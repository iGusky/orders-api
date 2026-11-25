import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MAX_POSTGRES_POSITIVE_INTEGER } from '../../../common/constants/index.js';
import { MIN_PRODUCT_PRICE_CENTS } from '../constants/index.js';

// Body de PATCH /products/:id (D32). Todo es opcional: solo cambia lo que se manda.
// El stock no está aquí a propósito: solo lo cambian los movimientos (D2). Como el ValidationPipe no usa `whitelist`,
// el service copia campo por campo en lugar de esparcir el DTO, para que un `stock` en el body se ignore.
export class UpdateProductDto {
  // @IsOptional dejaría pasar `null`, y name no admite null: solo se omite la validación si no viene.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;

  // `null` borra la descripción.
  @IsOptional()
  @IsString()
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(MIN_PRODUCT_PRICE_CENTS)
  @Max(MAX_POSTGRES_POSITIVE_INTEGER)
  priceCents?: number;
}
