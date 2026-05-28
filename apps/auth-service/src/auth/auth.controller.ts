import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { LoginDTO } from './dto/login.dto';
import { TokenVerificationDTO } from './dto/tokenVerification.dto';
import { ResendEmailTokenDTO } from './dto/resendEmailToken.dto';
import { RefreshTokenDTO } from './dto/refreshToken.dto';
import { LogoutDTO } from './dto/logout.dto';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(@Payload() body: CreateUserDTO) {
    return this.authService.register(body);
  }

  @MessagePattern('auth.verify-email')
  async emailVerification(@Payload() body: TokenVerificationDTO) {
    return this.authService.verifyEmail(body.token);
  }

  @MessagePattern('auth.resend-verification')
  async resendVerification(@Payload() body: ResendEmailTokenDTO) {
    return this.authService.resendVerificationToken(body.email);
  }

  @MessagePattern('auth.login')
  async login(@Payload() body: LoginDTO) {
    return this.authService.login(body.email, body.password);
  }

  @MessagePattern('auth.refresh-tokens')
  async refreshTokens(@Payload() body: RefreshTokenDTO) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() body: LogoutDTO) {
    return this.authService.logout(body.user_id);
  }

  @MessagePattern('auth.create-managed-user')
  async createManagedUser(@Payload() body: CreateManagedUserDto) {
    return this.authService.createManagedUser(body);
  }
  @MessagePattern('auth.reset-password')
  async resetPassword(@Payload() body: ResetPasswordDTO) {
    return this.authService.resetPassword(
      body.userId,
      body.currentPassword,
      body.newPassword,
    );
  }
  @MessagePattern('auth.search-user-by-id')
  async searchUserByID(@Payload() body: { id: string }) {
    return this.authService.searchUserByID(body.id);
  }
  @MessagePattern('auth.search-all-users')
  async searchAllUsers() {
    return this.authService.searchAllUsers();
  }
  @MessagePattern('auth.delete-user-by-id')
  async deleteUserById(@Payload() body: { id: string }) {
    return this.authService.deleteUserById(body.id);
  }
  @MessagePattern('auth.search-user-by-email')
  async searchUserByEmail(@Payload() body: { email: string }) {
    return this.authService.searchUserByEmail(body.email);
  }
  @MessagePattern('auth.deactivate-user')
  async deactivateUser(@Payload() body: { id: string }) {
    return this.authService.deactivateUser(body.id);
  }
}
