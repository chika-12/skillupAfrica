import { IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class CreateSchoolDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  address: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsNumber()
  phone_number: number;

  @IsNotEmpty()
  @IsNumber()
  max_students: number;

  @IsNotEmpty()
  @IsNumber()
  price_per_student: number;
}
