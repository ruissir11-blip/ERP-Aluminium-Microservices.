import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WorkOrder } from './WorkOrder';
import { Machine } from './Machine';

export enum BreakdownSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
}

@Entity('breakdown_records')
@Index(['workOrderId'])
@Index(['machineId'])
@Index(['reportedAt'])
export class BreakdownRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (wo) => wo.breakdownRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ type: 'uuid', name: 'machine_id' })
  machineId!: string;

  @ManyToOne(() => Machine, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'machine_id' })
  machine!: Machine;

  @Column({ type: 'timestamp', default: () => 'now()', name: 'reported_at' })
  reportedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt?: Date;

  @Column({ type: 'integer', nullable: true, name: 'response_time_minutes' })
  responseTimeMinutes?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'repair_start_time' })
  repairStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'repair_end_time' })
  repairEndTime?: Date;

  @Column({ type: 'integer', nullable: true, name: 'repair_time_minutes' })
  repairTimeMinutes?: number;

  @Column({ type: 'integer', nullable: true, name: 'downtime_minutes' })
  downtimeMinutes?: number;

  @Column({ type: 'enum', enum: BreakdownSeverity })
  severity!: BreakdownSeverity;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ type: 'text', nullable: true, name: 'root_cause' })
  rootCause?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
