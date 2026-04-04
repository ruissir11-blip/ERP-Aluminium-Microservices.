import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerOrder } from '../aluminium/CustomerOrder';

@Entity('order_costing')
@Index('idx_order_costing_order', ['orderId'])
@Index('idx_order_costing_margin', ['marginPercent'])
export class OrderCosting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  orderId!: string;

  @ManyToOne(() => CustomerOrder)
  @JoinColumn({ name: 'order_id' })
  order!: CustomerOrder;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  materialCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  laborCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  overheadCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  revenue!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  margin!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  marginPercent!: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  estimatedMargin!: number | null;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  actualMargin!: number | null;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  marginVariance!: number | null;

  @CreateDateColumn()
  calculatedAt!: Date;
}
