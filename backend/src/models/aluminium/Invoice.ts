import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToOne } from 'typeorm';
import { Customer } from './Customer';
import { CustomerOrder } from './CustomerOrder';

export enum InvoiceStatus {
  BROUILLON = 'BROUILLON',
  VALIDÉE = 'VALIDÉE',
  ENVOYÉE = 'ENVOYÉE',
  PAYÉE = 'PAYÉE',
  EN_RETARD = 'EN_RETARD',
  ANNULÉE = 'ANNULÉE',
}

export enum PaymentMethod {
  ESPÈCES = 'ESPÈCES',
  CHÈQUE = 'CHÈQUE',
  VIREMENT = 'VIREMENT',
  CARTE_BANCAIRE = 'CARTE_BANCAIRE',
  AUTRE = 'AUTRE',
}

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['status'])
@Index(['customerId'])
@Index(['dueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  orderId?: string;

  @OneToOne(() => CustomerOrder)
  @JoinColumn({ name: 'order_id' })
  order?: CustomerOrder;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.BROUILLON })
  status!: InvoiceStatus;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({ type: 'date', name: 'due_date' })
  dueDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 4, name: 'subtotal' })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, name: 'discount_amount' })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19, name: 'vat_rate' })
  vatRate!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, name: 'vat_amount' })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  total!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, name: 'amount_paid' })
  amountPaid!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, name: 'amount_due' })
  amountDue!: number;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true, name: 'payment_method' })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'date', nullable: true, name: 'payment_date' })
  paymentDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_reference' })
  paymentReference?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
