import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { normalizeEmail } from '../../../common/utils/index.js';

export class AddMemberDto {
  // Se normaliza antes de validar (RF1): "  Ana@Gmail.com " → "ana@gmail.com".
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
