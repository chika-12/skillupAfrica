import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { School } from './entities/school.entity';
import { SchoolAdmin } from './entities/school-admin.entity';
import { Student } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School, SchoolAdmin, Student])],
  controllers: [SchoolController],
  providers: [SchoolService],
})
export class SchoolModule {}
