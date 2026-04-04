import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { StorageLocation } from './StorageLocation';
import { InventoryItem } from './InventoryItem';

@Entity('warehouses')
@Index(['code'], { unique: true })
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName?: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => StorageLocation, location => location.warehouse)
  locations!: StorageLocation[];

  @OneToMany(() => InventoryItem, item => item.warehouse)
  inventoryItems!: InventoryItem[];
}
