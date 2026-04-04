import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Warehouse } from './Warehouse';
import { StorageLocation } from './StorageLocation';
import { Lot } from './Lot';

export enum MovementType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  COUNT = 'COUNT',
}

@Entity('stock_movements')
@Index(['profileId', 'warehouseId'])
@Index(['movementType'])
@Index(['performedAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId?: string;

  @ManyToOne(() => StorageLocation, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: StorageLocation;

  @Column({ name: 'lot_id', type: 'uuid', nullable: true })
  lotId?: string;

  @ManyToOne(() => Lot, { nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot?: Lot;

  @Column({ name: 'movement_type', type: 'varchar', length: 20 })
  movementType!: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 4, nullable: true })
  unitCost?: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 14, scale: 4, nullable: true })
  totalCost?: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 50 })
  referenceType!: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 50 })
  referenceId!: string;

  @Column({ name: 'source_warehouse_id', type: 'uuid', nullable: true })
  sourceWarehouseId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'performed_by', type: 'uuid' })
  performedBy!: string;

  @Column({ name: 'performed_at', type: 'timestamp' })
  performedAt!: Date;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'previous_quantity', type: 'decimal', precision: 10, scale: 3 })
  previousQuantity!: number;

  @Column({ name: 'new_quantity', type: 'decimal', precision: 10, scale: 3 })
  newQuantity!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
