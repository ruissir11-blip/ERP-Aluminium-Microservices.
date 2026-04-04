import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('customers')
@Index(['code'], { unique: true })
@Index(['companyName'])
@Index(['isActive'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, name: 'company_name' })
  companyName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_name' })
  contactName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, name: 'billing_street' })
  billingStreet!: string;

  @Column({ type: 'varchar', length: 100, name: 'billing_city' })
  billingCity!: string;

  @Column({ type: 'varchar', length: 20, name: 'billing_postal_code' })
  billingPostalCode!: string;

  @Column({ type: 'varchar', length: 100, default: 'France', name: 'billing_country' })
  billingCountry!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'shipping_street' })
  shippingStreet?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'shipping_city' })
  shippingCity?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'shipping_postal_code' })
  shippingPostalCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'shipping_country' })
  shippingCountry?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_terms' })
  paymentTerms?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vat_number' })
  vatNumber?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
