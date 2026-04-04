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

@Entity('receivable_aging')
@Index('idx_receivable_aging_customer', ['customerId'])
@Index('idx_receivable_aging_period', ['period'])
export class ReceivableAging {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column('date')
  period!: Date;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  aging_0_30!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  aging_31_60!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  aging_61_90!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  aging_90_plus!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total!: number;

  @CreateDateColumn()
  calculatedAt!: Date;
}
