import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NonConformity } from './NonConformity';
import { User } from '../User';

export enum DecisionType {
  CONFORME = 'conforme',
  NON_CONFORME = 'non_conforme',
  A_RETRAVAILLER = 'a_retravailler',
  REBUT = 'rebut',
  DEROGATION = 'derogation',
}

export enum DecisionStatus {
  EN_ATTENTE = 'en_attente',
  APPROUVE = 'approuve',
  REJETE = 'rejete',
}

@Entity('quality_decisions')
export class QualityDecision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  nc_id!: string;

  @ManyToOne(() => NonConformity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nc_id' })
  nonConformity!: NonConformity;

  @Column({ type: 'varchar', length: 20 })
  decision_type!: DecisionType;

  @Column({ type: 'varchar', length: 20, default: DecisionStatus.EN_ATTENTE })
  status!: DecisionStatus;

  @Column({ type: 'uuid' })
  approved_by!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedBy!: User;

  @Column({ type: 'timestamp' })
  approved_at!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity!: number;

  @Column({ type: 'jsonb', nullable: true })
  supporting_documents!: string[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
