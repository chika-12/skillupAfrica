import { Module } from '@nestjs/common';
import { SchoolServiceController } from './school-service.controller';
import { SchoolServiceService } from './school-service.service';

@Module({
  imports: [],
  controllers: [SchoolServiceController],
  providers: [SchoolServiceService],
})
export class SchoolServiceModule {}
