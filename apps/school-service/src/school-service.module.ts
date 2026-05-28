import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolAdmin } from './school/entities/school-admin.entity';
import { School } from './school/entities/school.entity';
import { Student } from './school/entities/student.entity';
import { SchoolModule } from './school/school.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SchoolModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('SCHOOL_DB_HOST'),
        port: configService.get<number>('SCHOOL_DB_PORT'),
        username: configService.get('SCHOOL_DB_USERNAME'),
        password: configService.get('SCHOOL_DB_PASSWORD'),
        database: configService.get('SCHOOL_DB_NAME'),
        entities: [School, SchoolAdmin, Student],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class SchoolServiceModule {}
