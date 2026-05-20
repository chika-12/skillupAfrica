import { IsNotEmpty, IsUUID, IsPhoneNumber, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsUUID()
  school_id: string;

  @IsNotEmpty()
  username: string;

  @IsOptional()
  @IsPhoneNumber()
  parent_phone?: string;

  @IsOptional()
  student_reg_no?: string;
}
