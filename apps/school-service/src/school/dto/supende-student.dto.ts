import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class SuspendStudentDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNotEmpty()
  reason: string;
}
