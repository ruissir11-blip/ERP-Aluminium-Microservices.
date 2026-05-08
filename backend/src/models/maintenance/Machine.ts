import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { MachineDocument } from './MachineDocument';
import { WorkOrder } from './WorkOrder';

export enum MachineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN_DOWN = 'BROKEN_DOWN',
  ARCHIVED = 'ARCHIVED',
}

@Entity('machines')
@Index(['designation'])
@Index(['status'])
@Index(['serialNumber'], { unique: true, where: "serial_number IS NOT NULL" })
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  designation!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'serial_number' })
  serialNumber?: string;

  @Column({ type: 'date', nullable: true, name: 'purchase_date' })
  purchaseDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'acquisition_value' })
  acquisitionValue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'residual_value' })
  residualValue?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  workshop?: string;

  @Column({ type: 'text', nullable: true, name: 'location_details' })
  locationDetails?: string;

  @Column({ type: 'date', nullable: true, name: 'installation_date' })
  installationDate?: Date;

  @Column({ type: 'integer', default: 0, name: 'operational_hours' })
  operationalHours!: number;

  @Column({ type: 'enum', enum: MachineStatus, default: MachineStatus.ACTIVE })
  status!: MachineStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => MachineDocument, (doc) => doc.machine, { cascade: true })
  documents!: MachineDocument[];

  @OneToMany(() => WorkOrder, (wo) => wo.machine)
  workOrders!: WorkOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
