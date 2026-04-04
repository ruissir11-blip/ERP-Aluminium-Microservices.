import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Training } from './Training';
import { TrainingEnrollment } from './TrainingEnrollment';

export enum TrainingSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('training_sessions')
@Index(['trainingId'])
@Index(['scheduledDate'])
@Index(['status'])
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'training_id' })
  trainingId: string;

  @ManyToOne(() => Training, (training) => training.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'training_id' })
  training: Training;

  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'integer', nullable: true, name: 'max_participants' })
  maxParticipants: number | null;

  @Column({
    type: 'enum',
    enum: TrainingSessionStatus,
    default: TrainingSessionStatus.SCHEDULED,
    name: 'status',
  })
  status: TrainingSessionStatus;

  @OneToMany(() => TrainingEnrollment, (enrollment) => enrollment.session)
  enrollments: TrainingEnrollment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
