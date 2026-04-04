import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Warehouse } from './Warehouse';
import { StorageLocation } from './StorageLocation';
import { Lot } from './Lot';

@Entity('inventory_items')
@Index(['profileId', 'warehouseId', 'locationId', 'lotId'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, warehouse => warehouse.inventoryItems)
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

  @Column({ name: 'quantity_on_hand', type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantityOnHand!: number;

  @Column({ name: 'quantity_reserved', type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantityReserved!: number;

  @Column({ name: 'average_unit_cost', type: 'decimal', precision: 12, scale: 4, nullable: true })
  averageUnitCost?: number;

  @Column({ name: 'reorder_quantity', type: 'int', nullable: true })
  reorderQuantity?: number;

  @Column({ name: 'minimum_order_quantity', type: 'int', nullable: true })
  minimumOrderQuantity?: number;

  @Column({ name: 'last_movement_date', type: 'timestamp', nullable: true })
  lastMovementDate?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
