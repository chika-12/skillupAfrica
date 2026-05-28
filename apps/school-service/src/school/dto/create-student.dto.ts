import { IsNotEmpty, IsUUID, IsPhoneNumber, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  schoolId: string;

  @IsNotEmpty()
  username: string;

  @IsOptional()
  @IsPhoneNumber()
  parent_phone?: string;

  @IsOptional()
  student_reg_no?: string;
}
