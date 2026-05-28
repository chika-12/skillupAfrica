import {
  Controller,
  Body,
  Post,
  Get,
  UseGuards,
  Inject,
  ForbiddenException,
  Delete,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../../auth-service/src/auth/enums/user-role.enum';
import { CreateSchoolDto } from '../../../school-service/src/school/dto/create-school.dto';
//import { CreateSchoolAdminDto } from '../../../school-service/src/school/dto/create-school-admin.dto';
import { UpdateSchoolDto } from '../../../school-service/src/school/dto/update-school.dto';
import { SuspendStudentDto } from '../../../school-service/src/school/dto/supende-student.dto';
//import { CreateStudentDto } from 'apps/school-service/src/school/dto/create-student.dto';
import { Req } from '@nestjs/common';
import { CreateStudentRequestDto } from './dto/create-student.dto';
import { customAlphabet } from 'nanoid';
import { CreateSchoolAdminRequestDto } from './dto/create-school-admin.dto';
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6);

@Controller('school')
export class SchoolController {
  constructor(
    @Inject('SCHOOL_SERVICE') private schoolClient: ClientProxy,
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}
  @Post('create-school')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSchool(@Body() body: CreateSchoolDto) {
    return firstValueFrom(this.schoolClient.send('school.create-school', body));
  }
  @Post('create-school-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSchoolAdmin(@Body() body: CreateSchoolAdminRequestDto) {
    const school = await firstValueFrom(
      this.schoolClient.send('school.search-school-by-email', {
        email: body.schoolEmail,
      }),
    );
    if (!school) {
      throw new ForbiddenException('No school found with the provided email');
    }

    const user = await firstValueFrom(
      this.authClient.send('auth.create-managed-user', {
        name: body.name,
        email: body.email,
        username: `${body.name.split(' ')[0].toLowerCase()}${nanoid()}`,
        role: UserRole.SCHOOL_ADMIN,
        phone: body.phone,
      }),
    );
    const userId = user.userId;
    const schoolId = school.id;
    try {
      return await firstValueFrom(
        this.schoolClient.send('school.create-admin', { userId, schoolId }),
      );
    } catch (error) {
      console.log('Error creating school admin:', error);
      await firstValueFrom(
        this.authClient.send('auth.delete-user-by-id', {
          id: userId,
        }),
      );
      throw error;
    }
  }
  @Get('school-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSchoolDetails(@Body() body: string) {
    return firstValueFrom(
      this.schoolClient.send('school.school-details', body),
    );
  }
  @Get('all-schools')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllSchools() {
    return firstValueFrom(this.schoolClient.send('school.all-schools', {}));
  }
  @Get('school-admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSchoolAdmins() {
    return firstValueFrom(this.schoolClient.send('school.school-admins', {}));
  }
  @Post('create-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  async createStudent(@Body() body: CreateStudentRequestDto, @Req() req: any) {
    const { id, role } = req.user as { id: string; role: UserRole };
    const adminUser = await firstValueFrom(
      this.schoolClient.send('school.get-admin-by-id', { userId: id }),
    );
    //console.log('logged reach1', adminUser);
    const schoolId = adminUser?.school?.id;
    if (!schoolId) {
      throw new ForbiddenException(
        'Admin user is not associated with any school',
      );
    }
    const nameSplit = body.name.split(' ');
    const firstName = nameSplit[0].toLowerCase();
    const lastName = nameSplit[1]?.toLowerCase() ?? '';
    const username = `${firstName}${lastName}${nanoid()}`;

    const studentUser = await firstValueFrom(
      this.authClient.send('auth.create-managed-user', {
        name: body.name,
        email: body.email,
        username: username,
        role: UserRole.STUDENT,
      }),
    );

    //console.log('logged reach2', studentUser);
    try {
      return await firstValueFrom(
        this.schoolClient.send('school.create-student', {
          userId: studentUser.userId,
          schoolId,
          username,
          parent_phone: body.parent_phone,
          student_reg_no: body.student_reg_no,
        }),
      );
    } catch (error) {
      await firstValueFrom(
        this.authClient.send('auth.delete-user-by-id', {
          id: studentUser.userId,
        }),
      );
      throw error;
    }
  }
  @Get('students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async getStudents(@Body() body: string) {
    return firstValueFrom(this.schoolClient.send('school.get-students', body));
  }
  //gets all students of a particular school
  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async getStudent(@Body() body: { studentId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.get-student', body.studentId),
    );
  }

  @Get('student-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async getStudentDetails(@Body() body: { studentId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.get-student', body.studentId),
    );
  }

  // @Get('student-suspension-status')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  // async getStudentSuspensionStatus(@Body() body: string) {
  //   return firstValueFrom(
  //     this.schoolClient.send('school.student-suspension-status', body),
  //   );
  // }
  @Post('suspend-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async suspendStudent(@Body() body: SuspendStudentDto) {
    return firstValueFrom(
      this.schoolClient.send('school.suspend-student', body),
    );
  }

  @Post('reactivate-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async reactivateStudent(@Body() body: { studentId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.reactivate-student', body.studentId),
    );
  }
  @Post('deactivate-school')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivateSchool(@Body() body: { schoolId: string; reason: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.deactivate-school', body),
    );
  }
  @Post('reactivate-school')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reactivateSchool(@Body() body: { schoolId: string; reason: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.reactivate-school', body.schoolId),
    );
  }
  @Delete('delete-school')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteSchool(@Body() body: { schoolId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.delete-school', body.schoolId),
    );
  }
  @Delete('delete-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteStudent(@Body() body: { studentId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.delete-student', body.studentId),
    );
  }
  @Delete('delete-school-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteSchoolAdmin(@Body() body: { adminId: string }) {
    try {
      const result = await firstValueFrom(
        this.schoolClient.send('school.delete-school-admin', body.adminId),
      );
      console.log('Delete school admin result:', result);
      if (result.status === 'success') {
        await firstValueFrom(
          this.authClient.send('auth.deactivate-user', {
            id: result.userId,
          }),
        );
      }
      return result;
    } catch (error) {
      console.log('Error deleting school admin:', error);
      throw error;
    }
  }
  @Put('update-school')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSchool(
    @Body() body: { schoolId: string; schoolData: UpdateSchoolDto },
  ) {
    return firstValueFrom(this.schoolClient.send('school.update-school', body));
  }
  @Post('admin-by-id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async getAdminById(@Body() body: { adminId: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.get-admin-by-id', body.adminId),
    );
  }
  @Post('search-school-by-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchSchoolByEmail(@Body() body: { email: string }) {
    return firstValueFrom(
      this.schoolClient.send('school.search-school-by-email', body.email),
    );
  }
  @Get('search-all-admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchAllAdmins() {
    return firstValueFrom(
      this.schoolClient.send('school.search-all-admins', {}),
    );
  }
}
