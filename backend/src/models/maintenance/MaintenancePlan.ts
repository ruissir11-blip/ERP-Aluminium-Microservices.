import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Machine } from './Machine';

export enum MaintenanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

@Entity('maintenance_plans')
@Index(['machineId'])
@Index(['nextDueDate'])
@Index(['isActive'])
export class MaintenancePlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'machine_id' })
  machineId!: string;

  @ManyToOne(() => Machine, (machine) => machine.maintenancePlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine!: Machine;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 255, name: 'task_type' })
  taskType!: string;

  @Column({ type: 'enum', enum: MaintenanceFrequency })
  frequency!: MaintenanceFrequency;

  @Column({ type: 'integer', nullable: true, name: 'frequency_days' })
  frequencyDays?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'estimated_duration_hours' })
  estimatedDurationHours?: number;

  @Column({ type: 'date', nullable: true, name: 'next_due_date' })
  nextDueDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'last_completed_date' })
  lastCompletedDate?: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_technician_id' })
  assignedTechnicianId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
