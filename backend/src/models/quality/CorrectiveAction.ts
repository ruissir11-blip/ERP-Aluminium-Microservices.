import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NonConformity } from './NonConformity';
import { User } from '../User';

export enum CorrectiveActionStatus {
  A_FAIRE = 'a_faire',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  VERIFIE = 'verifie',
}

@Entity('corrective_actions')
export class CorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  nc_id!: string;

  @ManyToOne(() => NonConformity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nc_id' })
  nonConformity!: NonConformity;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo!: User;

  @Column({ type: 'date' })
  due_date!: Date;

  @Column({ type: 'varchar', length: 20, default: CorrectiveActionStatus.A_FAIRE })
  status!: CorrectiveActionStatus;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date;

  @Column({ type: 'text', nullable: true })
  effectiveness_verification!: string;

  @Column({ type: 'uuid', nullable: true })
  verified_by!: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
