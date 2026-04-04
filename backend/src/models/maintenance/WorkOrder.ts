import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Machine } from './Machine';
import { MaintenancePlan } from './MaintenancePlan';
import { WorkOrderPart } from './WorkOrderPart';
import { BreakdownRecord } from './BreakdownRecord';

export enum WorkOrderType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  IMPROVEMENT = 'IMPROVEMENT',
  INSPECTION = 'INSPECTION',
}

export enum WorkOrderStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum WorkOrderPriority {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  ROUTINE = 'ROUTINE',
}

@Entity('work_orders')
@Index(['workOrderNumber'], { unique: true })
@Index(['machineId'])
@Index(['status'])
@Index(['priority'])
@Index(['assignedTo'])
@Index(['scheduledDate'])
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'work_order_number' })
  workOrderNumber!: string;

  @Column({ type: 'uuid', name: 'machine_id' })
  machineId!: string;

  @ManyToOne(() => Machine, (machine) => machine.workOrders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'machine_id' })
  machine!: Machine;

  @Column({ type: 'uuid', nullable: true, name: 'maintenance_plan_id' })
  maintenancePlanId?: string;

  @ManyToOne(() => MaintenancePlan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'maintenance_plan_id' })
  maintenancePlan?: MaintenancePlan;

  @Column({ type: 'enum', enum: WorkOrderType })
  type!: WorkOrderType;

  @Column({ type: 'enum', enum: WorkOrderStatus, default: WorkOrderStatus.CREATED })
  status!: WorkOrderStatus;

  @Column({ type: 'enum', enum: WorkOrderPriority, default: WorkOrderPriority.ROUTINE })
  priority!: WorkOrderPriority;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true, name: 'scheduled_date' })
  scheduledDate?: Date;

  @Column({ type: 'time', nullable: true, name: 'scheduled_start_time' })
  scheduledStartTime?: string;

  @Column({ type: 'time', nullable: true, name: 'scheduled_end_time' })
  scheduledEndTime?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_start_datetime' })
  actualStartDatetime?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_end_datetime' })
  actualEndDatetime?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'labor_hours' })
  laborHours?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'labor_rate' })
  laborRate?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'labor_cost' })
  laborCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'parts_cost' })
  partsCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_cost' })
  totalCost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true, name: 'completion_notes' })
  completionNotes?: string;

  @OneToMany(() => WorkOrderPart, (part) => part.workOrder, { cascade: true })
  parts!: WorkOrderPart[];

  @OneToMany(() => BreakdownRecord, (br) => br.workOrder)
  breakdownRecords!: BreakdownRecord[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'closed_at' })
  closedAt?: Date;
}
