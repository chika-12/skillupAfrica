import { IsNotEmpty, IsNumber, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateSchoolDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  address: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  @IsNumber()
  max_students: number;

  @IsNotEmpty()
  @IsNumber()
  price_per_student: number;
}
