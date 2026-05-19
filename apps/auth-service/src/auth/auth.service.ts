import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { EmailService } from '../email-service/email.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './enums/user-role.enum';
import { RpcException } from '@nestjs/microservices';

interface JwtPayload {
  id: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private UserRepository: Repository<User>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async register(
    req: CreateUserDTO,
  ): Promise<{ status: string; message: string }> {
    const { name, email, password } = req;
    const existingUser: User | null = await this.UserRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new RpcException({
        statusCode: 409,
        message: 'User already exist',
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      1000 + Math.random() * 9000,
    ).toString();
    const expiry = new Date();
    expiry.setTime(expiry.getTime() + 1000 * 60 * 60);

    const user = this.UserRepository.create({
      name,
      email,
      password: encryptedPassword,
      role: UserRole.STUDENT,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry: expiry,
    });
    await this.UserRepository.save(user);
    await this.emailService.sendEmail(
      email,
      'Token Verification',
      verificationToken,
    );
    return {
      status: 'Success',
      message: 'Please confirm your email',
    };
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  async verifyEmail(
    token: string,
  ): Promise<{ status: string; message: string }> {
    const dbToken = await this.UserRepository.findOne({
      where: { verificationToken: token },
    });

    if (!dbToken) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }
    if (dbToken.isVerified === true) {
      throw new RpcException({
        statusCode: 409,
        message: 'User is already verified',
      });
    }
    if (
      !dbToken.verificationTokenExpiry ||
      new Date() > dbToken.verificationTokenExpiry
    ) {
      throw new RpcException({ statusCode: 400, message: 'Token Expired' });
    }

    dbToken.isVerified = true;
    dbToken.verificationToken = null;
    dbToken.verificationTokenExpiry = null;
    await this.UserRepository.save(dbToken);
    return {
      status: 'Success',
      message: 'User is verified',
    };
  }

  async resendVerificationToken(
    email: string,
  ): Promise<{ status: string; message: string }> {
    const verifyUser = await this.UserRepository.findOne({
      where: { email },
    });

    if (!verifyUser) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }
    if (verifyUser.isVerified) {
      throw new RpcException({
        statusCode: 409,
        message: 'User is already verified',
      });
    }

    const verificationToken = Math.floor(
      1000 + Math.random() * 9000,
    ).toString();
    verifyUser.verificationToken = verificationToken;
    verifyUser.verificationTokenExpiry = new Date();
    verifyUser.verificationTokenExpiry.setTime(
      verifyUser.verificationTokenExpiry.getTime() + 1000 * 60 * 60,
    );
    await this.UserRepository.save(verifyUser);
    await this.emailService.sendEmail(
      email,
      'Token Verification',
      verificationToken,
    );
    return {
      status: 'Success',
      message: 'Verification token resent',
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.UserRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }
    if (!user.isVerified || !user.isActive) {
      throw new RpcException({
        statusCode: 401,
        message: 'You are not permitted to login',
      });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const load = { id: user.id, role: user.role };
    const refreshToken = this.generateRefreshToken(load);
    const accessToken = this.generateAccessToken(load);
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.UserRepository.save(user);
    return { refreshToken, accessToken };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }

    const user = await this.UserRepository.findOne({
      where: { id: payload.id },
    });

    if (!user || !user.isActive || !user.isVerified) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }
    if (!(await bcrypt.compare(refreshToken, user.refreshToken!))) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }

    const newAccessToken = this.generateAccessToken({
      id: user.id,
      role: user.role,
    });
    return { accessToken: newAccessToken };
  }

  async logout(userId: string): Promise<{ status: string; message: string }> {
    const user = await this.UserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    user.refreshToken = null;
    await this.UserRepository.save(user);
    return {
      status: 'Success',
      message: 'Logged out successfully',
    };
  }
}
