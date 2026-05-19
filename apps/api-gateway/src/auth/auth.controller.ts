import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../../../auth-service/src/auth/enums/user-role.enum';
import { CreateUserDTO } from '../../../auth-service/src/auth/dto/create-user.dto';
import { LoginDTO } from '../../../auth-service/src/auth/dto/login.dto';
import { TokenVerificationDTO } from '../../../auth-service/src/auth/dto/tokenVerification.dto';
import { ResendEmailTokenDTO } from '../../../auth-service/src/auth/dto/resendEmailToken.dto';
import { RefreshTokenDTO } from '../../../auth-service/src/auth/dto/refreshToken.dto';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  @Post('register')
  async register(@Body() body: CreateUserDTO) {
    return firstValueFrom(this.authClient.send('auth.register', body));
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: TokenVerificationDTO) {
    return firstValueFrom(this.authClient.send('auth.verify-email', body));
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: ResendEmailTokenDTO) {
    return firstValueFrom(
      this.authClient.send('auth.resend-verification', body),
    );
  }

  @Post('login')
  async login(@Body() body: LoginDTO) {
    return firstValueFrom(this.authClient.send('auth.login', body));
  }

  @Post('refresh-tokens')
  async refreshTokens(@Body() body: RefreshTokenDTO) {
    return firstValueFrom(this.authClient.send('auth.refresh-tokens', body));
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async logout(@Request() req: any) {
    return firstValueFrom(
      this.authClient.send('auth.logout', { user_id: req.user.id }),
    );
  }
}
