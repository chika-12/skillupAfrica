import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
export class CreateSchoolAdminRequestDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsNotEmpty()
  schoolEmail: string;
}
