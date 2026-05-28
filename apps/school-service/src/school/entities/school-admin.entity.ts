import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { School } from './school.entity';

@Entity('school_admins')
export class SchoolAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  user_id: string;

  @ManyToOne(() => School, (school) => school.admins)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
