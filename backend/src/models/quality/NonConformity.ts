import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../User';

export enum NCSeverity {
  CRITIQUE = 'critique',
  MAJEUR = 'majeur',
  MINEUR = 'mineur',
}

export enum NCStatus {
  OUVERTE = 'ouverte',
  EN_COURS = 'en_cours',
  TRAITEMENT = 'traitement',
  CLOTUREE = 'cloturee',
}

@Entity('non_conformities')
export class NonConformity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  nc_number!: string;

  @Column({ type: 'uuid', nullable: true })
  production_order_id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lot_number!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 20 })
  severity!: NCSeverity;

  @Column({ type: 'varchar', length: 20, default: NCStatus.OUVERTE })
  status!: NCStatus;

  @Column({ type: 'uuid' })
  detected_by!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'detected_by' })
  detectedBy!: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  detected_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  photos!: string[];

  @Column({ type: 'text', nullable: true })
  resolution_notes!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
