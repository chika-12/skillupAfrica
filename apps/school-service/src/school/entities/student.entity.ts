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

  @Column({ unique: true })
  username: string;

  @Column()
  user_id: string;

  @ManyToOne(() => School, (school) => school.students)
  school: School;

  @Column({ default: false })
  is_suspended: boolean;

  @Column({ type: 'varchar', nullable: true })
  reason_for_suspension: string | null;

  @Column({ type: 'timestamp', nullable: true })
  suspension_end_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  suspension_start_date: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  parent_phone: string | null;

  @Column({ type: 'text', nullable: true })
  student_reg_no: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
