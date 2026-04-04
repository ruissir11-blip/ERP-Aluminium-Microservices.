import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NonConformity } from './NonConformity';

export enum RootCauseMethod {
  CINQ_POURQUOI = '5_pourquoi',
  ISHIKAWA = 'ishikawa',
}

export enum RootCauseCategory {
  MACHINE = 'machine',
  METHODE = 'methode',
  MATERIAU = 'materiau',
  HOMME = 'homme',
  ENVIRONNEMENT = 'environnement',
  MESURE = 'mesure',
}

@Entity('nc_root_causes')
export class NCRootCause {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  nc_id!: string;

  @ManyToOne(() => NonConformity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nc_id' })
  nonConformity!: NonConformity;

  @Column({ type: 'varchar', length: 20 })
  method!: RootCauseMethod;

  @Column({ type: 'jsonb', nullable: true })
  analysis_json!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  identified_cause!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  category!: RootCauseCategory;

  @Column({ type: 'text', nullable: true })
  recommendations!: string;

  @Column({ type: 'uuid', nullable: true })
  analyzed_by!: string;

  @Column({ type: 'timestamp', nullable: true })
  analyzed_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
