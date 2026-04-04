import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../aluminium/Customer';

@Entity('customer_profitability')
@Index('idx_customer_profit_customer', ['customerId'])
@Index('idx_customer_profit_calculated', ['calculatedAt'])
export class CustomerProfitability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  totalRevenue!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  totalCost!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  totalMargin!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  marginPercent!: number;

  @Column('integer', { default: 0 })
  orderCount!: number;

  @CreateDateColumn()
  calculatedAt!: Date;
}
