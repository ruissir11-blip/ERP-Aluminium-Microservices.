import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Warehouse } from './Warehouse';

export enum InventoryCountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  VARIANCE_REVIEW = 'VARIANCE_REVIEW',
  ADJUSTMENT_APPROVED = 'ADJUSTMENT_APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CountType {
  FULL = 'FULL',
  CYCLE = 'CYCLE',
  SPOT = 'SPOT',
}

@Entity('inventory_counts')
export class InventoryCount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'count_number', type: 'varchar', length: 20, unique: true })
  countNumber!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ type: 'varchar', length: 20, default: InventoryCountStatus.DRAFT })
  status!: InventoryCountStatus;

  @Column({ name: 'count_type', type: 'varchar', length: 20 })
  countType!: CountType;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'initiated_by', type: 'uuid' })
  initiatedBy!: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
