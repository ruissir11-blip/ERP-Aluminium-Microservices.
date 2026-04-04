import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../User';
import { InspectionPoint } from './InspectionPoint';

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InspectionResult {
  CONFORME = 'conforme',
  NON_CONFORME = 'non_conforme',
  EN_ATTENTE = 'en_attente',
}

@Entity('inspection_records')
export class InspectionRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  production_order_id!: string;

  @Column({ type: 'uuid' })
  inspection_point_id!: string;

  @ManyToOne(() => InspectionPoint)
  @JoinColumn({ name: 'inspection_point_id' })
  inspectionPoint!: InspectionPoint;

  @Column({ type: 'uuid' })
  inspector_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User;

  @Column({ type: 'varchar', length: 20, default: InspectionStatus.PENDING })
  status!: InspectionStatus;

  @Column({ type: 'varchar', length: 20, default: InspectionResult.EN_ATTENTE })
  result!: InspectionResult;

  @Column({ type: 'jsonb', nullable: true })
  measured_values_json!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  observations!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature!: string;

  @Column({ type: 'timestamp', nullable: true })
  signed_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
