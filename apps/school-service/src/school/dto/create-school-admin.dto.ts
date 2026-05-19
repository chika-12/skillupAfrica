import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSchoolAdminDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  school_id: string;
}
