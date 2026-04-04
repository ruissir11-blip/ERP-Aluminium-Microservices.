import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryCount } from './InventoryCount';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { StorageLocation } from './StorageLocation';
import { Lot } from './Lot';

export enum CountLineStatus {
  PENDING = 'PENDING',
  COUNTED = 'COUNTED',
  VARIANCE = 'VARIANCE',
  RECOUNT_REQUESTED = 'RECOUNT_REQUESTED',
}

export enum VarianceReasonCode {
  COUNT_ERROR = 'COUNT_ERROR',
  THEFT = 'THEFT',
  DAMAGE = 'DAMAGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  OTHER = 'OTHER',
}

@Entity('inventory_count_lines')
export class InventoryCountLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'count_id', type: 'uuid' })
  countId!: string;

  @ManyToOne(() => InventoryCount, count => count.id)
  @JoinColumn({ name: 'count_id' })
  count!: InventoryCount;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => StorageLocation)
  @JoinColumn({ name: 'location_id' })
  location!: StorageLocation;

  @Column({ name: 'lot_id', type: 'uuid', nullable: true })
  lotId?: string;

  @ManyToOne(() => Lot, { nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot?: Lot;

  @Column({ name: 'system_quantity', type: 'decimal', precision: 10, scale: 3 })
  systemQuantity!: number;

  @Column({ name: 'counted_quantity', type: 'decimal', precision: 10, scale: 3, nullable: true })
  countedQuantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  variance?: number;

  @Column({ name: 'variance_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  variancePercentage?: number;

  @Column({ name: 'count_status', type: 'varchar', length: 20, default: CountLineStatus.PENDING })
  countStatus!: CountLineStatus;

  @Column({ name: 'reason_code', type: 'varchar', length: 50, nullable: true })
  reasonCode?: VarianceReasonCode;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'counted_by', type: 'uuid', nullable: true })
  countedBy?: string;

  @Column({ name: 'counted_at', type: 'timestamp', nullable: true })
  countedAt?: Date;

  @Column({ name: 'is_adjusted', type: 'boolean', default: false })
  isAdjusted!: boolean;

  @Column({ name: 'adjustment_posted_at', type: 'timestamp', nullable: true })
  adjustmentPostedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
