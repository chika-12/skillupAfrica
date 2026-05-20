import { School } from './entities/school.entity';
import { SchoolAdmin } from './entities/school-admin.entity';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { RpcException } from '@nestjs/microservices';
import { CreateStudentDto } from './dto/create-student.dto';
//import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School) private schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student) private studentRepository: Repository<Student>,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
  ): Promise<{ status: string; school_id: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: [{ name: createSchoolDto.name }, { email: createSchoolDto.email }],
    });
    if (school) {
      throw new RpcException({
        statusCode: 409,
        message: 'A school with the same name or email already exists',
      });
    }
    const newSchool = this.schoolRepository.create(createSchoolDto);
    const savedSchool = await this.schoolRepository.save(newSchool);
    return {
      status: 'success',
      school_id: savedSchool.id,
      message: 'School created successfully',
    };
  }

  async createSchoolAdmin(
    schoolId: string,
    userId: string,
  ): Promise<{ status: string; admin_id: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['admins'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    if (!school.is_active) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cannot add admin to an inactive school',
      });
    }
    if (school.admins.length >= 1) {
      throw new RpcException({
        statusCode: 400,
        message: 'A school can have only one admin  ',
      });
    }
    const existingAdmin = await this.schoolAdminRepository.findOne({
      where: { user_id: userId, school: { id: schoolId } },
    });
    if (existingAdmin) {
      throw new RpcException({
        statusCode: 409,
        message: 'User is already an admin of this school',
      });
    }
    const newAdmin = this.schoolAdminRepository.create({
      user_id: userId,
      school: school,
    });
    const savedAdmin = await this.schoolAdminRepository.save(newAdmin);
    return {
      status: 'success',
      admin_id: savedAdmin.id,
      message: 'School admin created successfully',
    };
  }

  async getSchoolDetails(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['admins', 'students'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    return school;
  }
  async getAllSchools(): Promise<School[]> {
    return await this.schoolRepository.find({
      relations: ['admins', 'students'],
    });
  }

  async getSchoolAdmins(schoolId: string): Promise<SchoolAdmin[]> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['admins'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    return school.admins;
  }

  async createStudent(
    schoolId: string,
    studentData: CreateStudentDto,
  ): Promise<{ status: string; student_id: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['students'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }

    if (!school.is_active) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cannot add student to an inactive school',
      });
    }

    if (school.students.length >= school.max_students) {
      throw new RpcException({
        statusCode: 400,
        message: 'School has reached maximum student capacity',
      });
    }

    const existingStudent = await this.studentRepository.findOne({
      where: { username: studentData.username, school: { id: schoolId } },
    });
    if (existingStudent) {
      throw new RpcException({
        statusCode: 409,
        message: 'A student with the same username already exists',
      });
    }

    const newStudent = this.studentRepository.create({
      ...studentData,
      school: school,
    });
    const savedStudent = await this.studentRepository.save(newStudent);
    return {
      status: 'success',
      student_id: savedStudent.id,
      message: 'Student created successfully',
    };
  }

  async getStudents(schoolId: string): Promise<Student[]> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['students'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    return school.students;
  }
  async getStudentDetails(studentId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    return student;
  }
  async getStudentSchool(studentId: string): Promise<School> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    return student.school;
  }
  async getStudentSuspensionStatus(studentId: string): Promise<{
    is_suspended: boolean;
    reason_for_suspension: string | null;
  }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    return {
      is_suspended: student.is_suspended,
      reason_for_suspension: student.reason_for_suspension,
    };
  }

  async suspendStudent(
    studentId: string,
    reason: string,
    endDate?: Date,
  ): Promise<{ status: string; message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    student.is_suspended = true;
    student.reason_for_suspension = reason;
    student.suspension_start_date = new Date();
    student.suspension_end_date = endDate || null;
    await this.studentRepository.save(student);
    return {
      status: 'success',
      message: 'Student suspended successfully',
    };
  }
  async reactivateStudent(
    studentId: string,
  ): Promise<{ status: string; message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    student.is_suspended = false;
    student.reason_for_suspension = null;
    student.suspension_start_date = null;
    student.suspension_end_date = null;
    await this.studentRepository.save(student);
    return {
      status: 'success',
      message: 'Student reactivated successfully',
    };
  }
  async deactivateSchool(
    schoolId: string,
    reason: string,
  ): Promise<{ status: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    school.is_active = false;
    school.reason_for_deactivation = reason;
    await this.schoolRepository.save(school);
    return {
      status: 'success',
      message: 'School deactivated successfully',
    };
  }
  async reactivateSchool(
    schoolId: string,
  ): Promise<{ status: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    school.is_active = true;
    school.reason_for_deactivation = null;
    await this.schoolRepository.save(school);
    return {
      status: 'success',
      message: 'School reactivated successfully',
    };
  }

  async deleteSchool(
    schoolId: string,
  ): Promise<{ status: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['students'],
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }

    if (school.students.length > 0) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cannot delete school with active students',
      });
    }
    await this.schoolRepository.remove(school);
    return {
      status: 'success',
      message: 'School deleted successfully',
    };
  }

  async deleteStudent(
    studentId: string,
  ): Promise<{ status: string; message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new RpcException({ statusCode: 404, message: 'Student not found' });
    }
    await this.studentRepository.remove(student);
    return {
      status: 'success',
      message: 'Student deleted successfully',
    };
  }
  async deleteSchoolAdmin(
    adminId: string,
  ): Promise<{ status: string; message: string }> {
    const admin = await this.schoolAdminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new RpcException({
        statusCode: 404,
        message: 'School admin not found',
      });
    }
    await this.schoolAdminRepository.remove(admin);
    return {
      status: 'success',
      message: 'School admin deleted successfully',
    };
  }
  async updateSchool(
    schoolId: string,
    updateData: Partial<CreateSchoolDto>,
  ): Promise<{ status: string; message: string }> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new RpcException({ statusCode: 404, message: 'School not found' });
    }
    Object.assign(school, updateData);
    await this.schoolRepository.save(school);
    return {
      status: 'success',
      message: 'School updated successfully',
    };
  }
}
