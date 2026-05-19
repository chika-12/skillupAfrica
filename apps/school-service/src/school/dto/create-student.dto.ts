import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsUUID()
  school_id: string;
}
