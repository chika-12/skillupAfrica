import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  getStatus(): { service: string; status: string } {
    return { service: 'auth-service', status: 'online' };
  }
}
