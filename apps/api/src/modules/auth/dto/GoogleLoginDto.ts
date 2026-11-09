import { IsJWT, IsString } from 'class-validator';

export class GoogleLoginDto {
  /** ID token que entrega el botón de Google Identity Services (D23). */
  @IsString()
  @IsJWT()
  credential!: string;
}
