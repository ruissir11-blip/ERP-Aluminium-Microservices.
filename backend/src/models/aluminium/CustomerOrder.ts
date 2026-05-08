import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './Customer';
import { Quote } from './Quote';

export enum OrderStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMÉE = 'CONFIRMÉE',
  EN_PRODUCTION = 'EN_PRODUCTION',
  PARTIELLE = 'PARTIELLE',
  TERMINÉE = 'TERMINÉE',
  LIVRÉE = 'LIVRÉE',
  FACTURÉE = 'FACTURÉE',
  ANNULÉE = 'ANNULÉE',
}

@Entity('customer_orders')
@Index(['orderNumber'], { unique: true })
@Index(['status'])
@Index(['customerId'])
@Index(['deliveryDate'])
export class CustomerOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber!: string;

  @Column({ type: 'uuid', nullable: true, name: 'quote_id' })
  quoteId?: string;

  @OneToOne(() => Quote)
  @JoinColumn({ name: 'quote_id' })
  quote?: Quote;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'uuid', name: 'commercial_id' })
  commercialId!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.EN_ATTENTE })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, name: 'discount_amount' })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'vat_rate' })
  vatRate!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, name: 'vat_amount' })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  total!: number;

  @Column({ type: 'date', nullable: true, name: 'delivery_date' })
  deliveryDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'actual_delivery_date' })
  actualDeliveryDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'confirmed_at' })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
