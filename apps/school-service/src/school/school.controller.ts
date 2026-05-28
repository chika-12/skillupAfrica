import { MessagePattern, Payload } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { SuspendStudentDto } from './dto/supende-student.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Controller()
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}
  @MessagePattern('school.create-school')
  create(@Payload() body: CreateSchoolDto) {
    return this.schoolService.create(body);
  }
  @MessagePattern('school.create-admin')
  createAdmin(@Payload() body: CreateSchoolAdminDto) {
    const { userId, schoolId } = body;
    return this.schoolService.createSchoolAdmin(schoolId, userId);
  }

  @MessagePattern('school.school-details')
  getSchoolDetails(@Payload() body: { schoolId: string }) {
    return this.schoolService.getSchoolDetails(body.schoolId);
  }
  @MessagePattern('school.all-schools')
  getAllSchools() {
    return this.schoolService.getAllSchools();
  }
  @MessagePattern('school.school-admins')
  getSchoolAdmins(@Payload() body: { schoolId: string }) {
    return this.schoolService.getSchoolAdmins(body.schoolId);
  }
  @MessagePattern('school.create-student')
  createStudent(@Payload() body: CreateStudentDto) {
    return this.schoolService.createStudent(body);
  }
  @MessagePattern('school.get-students')
  getStudents(@Payload() body: { schoolId: string }) {
    return this.schoolService.getStudents(body.schoolId);
  }
  @MessagePattern('school.get-student')
  getStudent(@Payload() body: string) {
    return this.schoolService.getStudentDetails(body);
  }

  // @MessagePattern('school.student-suspension-status')
  // getStudentSuspensionStatus(@Payload() body: string) {
  //   return this.schoolService.getStudentSuspensionStatus(body);
  // }
  @MessagePattern('school.suspend-student')
  suspendStudent(@Payload() body: SuspendStudentDto) {
    return this.schoolService.suspendStudent(body);
  }
  @MessagePattern('school.reactivate-student')
  reactivateStudent(@Payload() body: string) {
    return this.schoolService.reactivateStudent(body);
  }
  @MessagePattern('school.deactivate-school')
  deactivateSchool(@Payload() body: { schoolId: string; reason: string }) {
    const { schoolId, reason } = body;
    return this.schoolService.deactivateSchool(schoolId, reason);
  }
  @MessagePattern('school.reactivate-school')
  reactivateSchool(@Payload() body: string) {
    return this.schoolService.reactivateSchool(body);
  }
  @MessagePattern('school.delete-school')
  deleteSchool(@Payload() schoolId: string) {
    return this.schoolService.deleteSchool(schoolId);
  }
  @MessagePattern('school.delete-student')
  deleteStudent(@Payload() studentId: string) {
    return this.schoolService.deleteStudent(studentId);
  }
  @MessagePattern('school.delete-school-admin')
  deleteSchoolAdmin(@Payload() adminId: string) {
    return this.schoolService.deleteSchoolAdmin(adminId);
  }

  @MessagePattern('school.update-school')
  updateSchool(
    @Payload() body: { schoolId: string; schoolData: UpdateSchoolDto },
  ) {
    const { schoolId, schoolData } = body;
    return this.schoolService.updateSchool(schoolId, schoolData);
  }

  @MessagePattern('school.get-admin-by-id')
  getAdminById(@Payload() adminId: string) {
    return this.schoolService.getAdminById(adminId);
  }
  @MessagePattern('school.search-school-by-email')
  searchSchoolByEmail(@Payload() body: { email: string }) {
    return this.schoolService.searchSchoolByEmail(body.email);
  }
  @MessagePattern('school.search-all-admins')
  searchAllAdmins() {
    return this.schoolService.searchAllAdmins();
  }
}
