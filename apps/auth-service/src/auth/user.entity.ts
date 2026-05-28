import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';

import { UserRole } from './enums/user-role.enum';
@Index(['role'])
@Index(['verificationToken'])
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true, type: 'varchar', default: null })
  email: string | null;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', unique: true, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ default: false })
  mustResetPassword: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
