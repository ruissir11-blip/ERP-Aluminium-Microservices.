import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../User';

export enum CertificateStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('certificates_of_conformity')
export class CertificateOfConformity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  certificate_number!: string;

  @Column({ type: 'uuid' })
  order_id!: string;

  @Column({ type: 'varchar', length: 100 })
  order_number!: string;

  @Column({ type: 'uuid' })
  customer_id!: string;

  @Column({ type: 'varchar', length: 255 })
  customer_name!: string;

  @Column({ type: 'text' })
  product_description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'timestamp' })
  inspection_date!: Date;

  @Column({ type: 'uuid' })
  inspector_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User;

  @Column({ type: 'boolean' })
  all_conforms!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nc_number!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'enum', enum: CertificateStatus, default: CertificateStatus.DRAFT })
  status!: CertificateStatus;

  @Column({ type: 'timestamp' })
  issued_at!: Date;

  @Column({ type: 'timestamp' })
  valid_until!: Date;

  @Column({ type: 'uuid', nullable: true })
  issued_by!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_by' })
  issuedBy!: User;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
