import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateStudentRequestDto {
  // for auth.create-managed-user
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  //   @IsNotEmpty()
  //   username: string;

  // for school.create-student
  @IsOptional()
  @IsPhoneNumber()
  parent_phone?: string;

  @IsOptional()
  student_reg_no?: string;

  // required only when caller is ADMIN, SCHOOL_ADMIN gets it from their profile
  //   @IsUUID()
  //   @IsOptional()
  //   schoolId?: string;
}
