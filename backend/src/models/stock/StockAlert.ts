import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Warehouse } from './Warehouse';

@Entity('stock_alerts')
@Index(['profileId'])
@Index(['isTriggered'])
export class StockAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId?: string;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse;

  @Column({ name: 'minimum_threshold', type: 'decimal', precision: 10, scale: 3 })
  minimumThreshold!: number;

  @Column({ name: 'maximum_threshold', type: 'decimal', precision: 10, scale: 3, nullable: true })
  maximumThreshold?: number;

  @Column({ name: 'reorder_point', type: 'decimal', precision: 10, scale: 3, nullable: true })
  reorderPoint?: number;

  @Column({ name: 'email_recipients', type: 'text', array: true, nullable: true })
  emailRecipients?: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_triggered', type: 'boolean', default: false })
  isTriggered!: boolean;

  @Column({ name: 'last_triggered_at', type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
