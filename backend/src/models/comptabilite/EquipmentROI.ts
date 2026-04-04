import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Machine } from '../maintenance/Machine';

@Entity('equipment_roi')
@Index('idx_equipment_roi_equipment', ['equipmentId'])
export class EquipmentROI {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  equipmentId!: string;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Machine;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  investmentCost!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  annualBenefit!: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  roiPercent!: number;

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  paybackYears!: number;

  @CreateDateColumn()
  calculatedAt!: Date;
}
