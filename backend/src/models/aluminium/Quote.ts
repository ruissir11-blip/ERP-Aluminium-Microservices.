import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Customer } from './Customer';
import { QuoteLine } from './QuoteLine';

export enum QuoteStatus {
  BROUILLON = 'BROUILLON',
  ENVOYÉ = 'ENVOYÉ',
  ACCEPTÉ = 'ACCEPTÉ',
  REFUSÉ = 'REFUSÉ',
  EXPIRÉ = 'EXPIRÉ',
  ANNULÉ = 'ANNULÉ',
  CONVERTED = 'CONVERTED',
  ARCHIVÉ = 'ARCHIVÉ',
}

@Entity('quotes')
@Index(['quoteNumber'], { unique: true })
@Index(['status'])
@Index(['customerId'])
@Index(['validUntil'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'quote_number' })
  quoteNumber!: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'uuid', name: 'commercial_id' })
  commercialId!: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.BROUILLON })
  status!: QuoteStatus;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, name: 'discount_amount' })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19.00, name: 'vat_rate' })
  vatRate!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, name: 'vat_amount' })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  total!: number;

  @Column({ type: 'date', name: 'valid_until' })
  validUntil!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true, name: 'customer_notes' })
  customerNotes?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'accepted_at' })
  acceptedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'converted_to_order_id' })
  convertedToOrderId?: string;

  @OneToMany(() => QuoteLine, (line) => line.quote, { cascade: true })
  lines!: QuoteLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
