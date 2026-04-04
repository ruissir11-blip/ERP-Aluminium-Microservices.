import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Warehouse } from './Warehouse';

@Entity('storage_locations')
@Index(['code'], { unique: true })
export class StorageLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, warehouse => warehouse.locations)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ type: 'varchar', length: 50 })
  zone!: string;

  @Column({ type: 'varchar', length: 50 })
  rack!: string;

  @Column({ type: 'varchar', length: 50 })
  aisle!: string;

  @Column({ type: 'varchar', length: 20 })
  level!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight?: number;

  @Column({ name: 'max_volume', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxVolume?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
