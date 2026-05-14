import { Controller, Get } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';

@Controller('auth')
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Get()
  getServiceStatus(): string {
    return 'AuthService Running';
  }

  @Get('status')
  getStatus(): { service: string; status: string } {
    return this.authServiceService.getStatus();
  }
}
