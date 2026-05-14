import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { EmailService } from '../email-service/email.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './enums/user-role.enum';

interface JwtPayload {
  id: string;
  role: string;
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
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exist');
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      1000 + Math.random() * 9000,
    ).toString();

    const user = this.UserRepository.create({
      name,
      email,
      password: encryptedPassword,
      role: UserRole.STUDENT,
      isVerified: false,
      verificationToken,
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
  generateRefreshToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }
  generateAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }
}
