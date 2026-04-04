import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BiWidget } from './Widget';

export enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  TECHNICAL = 'technical',
  CUSTOM = 'custom',
}

@Entity('bi_dashboards')
export class BiDashboard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255, nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: DashboardType,
    default: DashboardType.CUSTOM,
  })
  type!: DashboardType;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ default: true })
  isPublic!: boolean;

  @Column('uuid', { nullable: true })
  createdBy!: string | null;

  @Column('uuid', { nullable: true })
  updatedBy!: string | null;

  @Column('simple-json', { nullable: true })
  layout!: { widgets: Array<{ widgetId: string; x: number; y: number; w: number; h: number }> } | null;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => BiWidget, (widget) => widget.dashboard, { cascade: true })
  widgets!: BiWidget[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
