import {
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsPhoneNumber,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateManagedUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  username: string;
}
