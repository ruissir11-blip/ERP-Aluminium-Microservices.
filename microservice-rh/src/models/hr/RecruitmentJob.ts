import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Department } from './Department';

export enum RecruitmentJobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Entity('recruitment_jobs')
@Index(['departmentId'])
@Index(['status'])
@Index(['publishDate'])
export class RecruitmentJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId: string | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'job_type' })
  jobType: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'salary_range_min' })
  salaryRangeMin: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'salary_range_max' })
  salaryRangeMax: number | null;

  @Column({ type: 'date', nullable: true, name: 'publish_date' })
  publishDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'close_date' })
  closeDate: Date | null;

  @Column({
    type: 'enum',
    enum: RecruitmentJobStatus,
    default: RecruitmentJobStatus.DRAFT,
    name: 'status',
  })
  status: RecruitmentJobStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
