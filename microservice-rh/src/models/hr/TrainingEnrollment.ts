import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';
import { TrainingSession } from './TrainingSession';

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

@Entity('training_enrollments')
@Index(['employeeId'])
@Index(['sessionId'])
@Index(['status'])
export class TrainingEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.trainingEnrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => TrainingSession, (session) => session.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: TrainingSession;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ENROLLED,
    name: 'status',
  })
  status: EnrollmentStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'enrolled_at' })
  enrolledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'certificate_url' })
  certificateUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
