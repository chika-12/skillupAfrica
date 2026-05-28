import {
  IsOptional,
  IsNumber,
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
} from 'class-validator';

export class UpdateSchoolDto {
  @IsOptional()
  name: string;

  @IsOptional()
  address: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsOptional()
  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsNumber()
  max_students: number;

  @IsOptional()
  @IsNumber()
  price_per_student: number;
}
