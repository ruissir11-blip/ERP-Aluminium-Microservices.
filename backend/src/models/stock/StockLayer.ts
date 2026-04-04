import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Lot } from './Lot';
import { Warehouse } from './Warehouse';

@Entity('stock_layers')
@Index(['profileId', 'warehouseId'])
@Index(['receiptDate'])
export class StockLayer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'lot_id', type: 'uuid', nullable: true })
  lotId?: string;

  @ManyToOne(() => Lot, { nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot?: Lot;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ name: 'receipt_date', type: 'timestamp' })
  receiptDate!: Date;

  @Column({ name: 'original_quantity', type: 'decimal', precision: 10, scale: 3 })
  originalQuantity!: number;

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 })
  remainingQuantity!: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 4 })
  unitCost!: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 50 })
  referenceType!: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 50 })
  referenceId!: string;

  @Column({ name: 'is_exhausted', type: 'boolean', default: false })
  isExhausted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
