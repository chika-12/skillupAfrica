import { IsNotEmpty } from 'class-validator';
export class TokenVerificationDTO {
  @IsNotEmpty()
  token: string;
}
