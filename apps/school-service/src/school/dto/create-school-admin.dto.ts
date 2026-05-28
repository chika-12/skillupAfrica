import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSchoolAdminDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  schoolId: string;
}
