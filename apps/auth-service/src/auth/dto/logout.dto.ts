import { IsNotEmpty, IsUUID } from 'class-validator';

export class LogoutDTO {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
