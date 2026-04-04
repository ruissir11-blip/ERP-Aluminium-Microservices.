import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Lot } from './Lot';

export enum TraceabilityEventType {
  RECEIPT = 'RECEIPT',
  PRODUCTION = 'PRODUCTION',
  DELIVERY = 'DELIVERY',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
}

@Entity('lot_traceability')
@Index(['lotId'])
@Index(['eventDate'])
export class LotTraceability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lot_id', type: 'uuid' })
  lotId!: string;

  @ManyToOne(() => Lot, lot => lot.id)
  @JoinColumn({ name: 'lot_id' })
  lot!: Lot;

  @Column({ name: 'parent_traceability_id', type: 'uuid', nullable: true })
  parentTraceabilityId?: string;

  @Column({ name: 'event_type', type: 'varchar', length: 20 })
  eventType!: TraceabilityEventType;

  @Column({ name: 'event_date', type: 'timestamp' })
  eventDate!: Date;

  @Column({ name: 'reference_type', type: 'varchar', length: 50 })
  referenceType!: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 50 })
  referenceId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 })
  remainingQuantity!: number;

  @Column({ type: 'varchar', length: 500 })
  path!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
