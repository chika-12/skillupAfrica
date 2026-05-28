import { IsNotEmpty, IsUUID, MinLength } from 'class-validator';
export class ResetPasswordDTO {
  @IsNotEmpty()
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
