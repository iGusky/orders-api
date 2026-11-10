import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name

  @IsString()
  @IsNotEmpty()
  address

  @IsString()
  @IsNotEmpty()
  phone

  @IsString()
  @IsOptional()
  description
  
  @IsEmail()
  @IsOptional()
  contactEmail
}