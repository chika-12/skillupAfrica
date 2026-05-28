import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SchoolAdmin } from './school-admin.entity';
import { Student } from './student.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  address: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  max_students: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_student: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Column({ default: false })
  is_active: boolean;

  @OneToMany(() => SchoolAdmin, (admin) => admin.school)
  admins: SchoolAdmin[];

  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason_for_deactivation: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_until: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
