import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
//import { School } from 'apps/school-service/src/school/entities/school.entity';
import { SchoolModule } from './school/school.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, SchoolModule],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule {}
