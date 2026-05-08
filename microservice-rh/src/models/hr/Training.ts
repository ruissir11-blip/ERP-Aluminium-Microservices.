import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TrainingSession } from './TrainingSession';

@Entity('trainings')
export class Training {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  provider: string | null;

  @Column({ type: 'integer', nullable: true, name: 'duration_hours' })
  durationHours: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'certification_type' })
  certificationType: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean;

  @OneToMany(() => TrainingSession, (session) => session.training)
  sessions: TrainingSession[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
