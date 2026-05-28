import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  Request,
  ForbiddenException,
  Get,
  Delete,
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
import { CreateManagedUserDto } from '../../../auth-service/src/auth/dto/create-managed-user.dto';
import { ResetPasswordDTO } from './dto/resetPassword.dto';

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

  @Post('create-managed-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  async createManagedUser(
    @Request() req: any,
    @Body() body: CreateManagedUserDto,
  ) {
    const callerRole = req.user.role;

    // school admin can only create students
    if (
      callerRole === UserRole.SCHOOL_ADMIN &&
      body.role !== UserRole.STUDENT
    ) {
      throw new ForbiddenException('School admin can only create students');
    }

    return firstValueFrom(
      this.authClient.send('auth.create-managed-user', body),
    );
  }
  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Request() req: any, @Body() body: ResetPasswordDTO) {
    return firstValueFrom(
      this.authClient.send('auth.reset-password', {
        userId: req.user.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
    );
  }
  @Get('search-user-by-id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchUserByID(@Body() body: { id: string }) {
    return firstValueFrom(this.authClient.send('auth.search-user-by-id', body));
  }
  @Get('search-all-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchAllUsers() {
    return firstValueFrom(this.authClient.send('auth.search-all-users', {}));
  }
  @Delete('delete-user-by-id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUserById(@Body() body: { id: string }) {
    return firstValueFrom(this.authClient.send('auth.delete-user-by-id', body));
  }
  @Get('search-user-by-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchUserByEmail(@Body() body: { email: string }) {
    return firstValueFrom(
      this.authClient.send('auth.search-user-by-email', body),
    );
  }
}
