import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WorkOrder } from './WorkOrder';

@Entity('work_order_parts')
@Index(['workOrderId'])
@Index(['partId'])
export class WorkOrderPart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (wo) => wo.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ type: 'uuid', nullable: true, name: 'part_id' })
  partId?: string;

  @Column({ type: 'varchar', length: 100, name: 'part_reference' })
  partReference!: string;

  @Column({ type: 'varchar', length: 255, name: 'part_name' })
  partName!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'unit_cost' })
  unitCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_cost' })
  totalCost?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
