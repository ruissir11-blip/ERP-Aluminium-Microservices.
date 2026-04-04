import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Customer } from '../aluminium/Customer';

export enum LotQualityStatus {
  APPROVED = 'APPROVED',
  QUARANTINE = 'QUARANTINE',
  REJECTED = 'REJECTED',
}

@Entity('lots')
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lot_number', type: 'varchar', length: 50 })
  lotNumber!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Customer;

  @Column({ name: 'receipt_date', type: 'date' })
  receiptDate!: Date;

  @Column({ name: 'initial_quantity', type: 'decimal', precision: 10, scale: 3 })
  initialQuantity!: number;

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 })
  remainingQuantity!: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 4 })
  unitCost!: number;

  @Column({ name: 'certificate_of_conformity', type: 'varchar', length: 255, nullable: true })
  certificateOfConformity?: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'quality_status', type: 'varchar', length: 20, default: LotQualityStatus.QUARANTINE })
  qualityStatus!: LotQualityStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
