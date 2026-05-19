import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { School } from './school.entity';
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => School, (school) => school.students)
  school: School;

  @Column({ default: false })
  is_suspended: boolean;

  @Column({ nullable: true })
  reason_for_suspension: string;

  @Column({ type: 'timestamp', nullable: true })
  suspension_end_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  suspension_start_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  parent_phone: string | null;

  @Column({ nullable: true })
  student_reg_no: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
