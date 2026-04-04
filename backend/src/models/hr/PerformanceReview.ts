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
import { Employee } from './Employee';

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
}

@Entity('performance_reviews')
@Index(['employeeId'])
@Index(['reviewerId'])
@Index(['reviewDate'])
@Index(['status'])
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.performanceReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', nullable: true, name: 'reviewer_id' })
  reviewerId: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: Employee | null;

  @Column({ type: 'date', name: 'review_date' })
  reviewDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'review_period' })
  reviewPeriod: string | null;

  @Column({ type: 'integer', nullable: true, name: 'rating_overall' })
  ratingOverall: number | null;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ type: 'text', nullable: true, name: 'areas_for_improvement' })
  areasForImprovement: string | null;

  @Column({ type: 'text', nullable: true })
  goals: string | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.DRAFT,
    name: 'status',
  })
  status: ReviewStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
