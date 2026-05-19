import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendEmailTokenDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
