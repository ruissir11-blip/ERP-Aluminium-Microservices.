import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../User';

@Entity('commercial_performance')
@Index('idx_commercial_perf_user', ['commercialId'])
@Index('idx_commercial_perf_period', ['periodStart', 'periodEnd'])
export class CommercialPerformance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  commercialId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'commercial_id' })
  commercial!: User;

  @Column('date')
  periodStart!: Date;

  @Column('date')
  periodEnd!: Date;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  revenue!: number;

  @Column('integer', { default: 0 })
  orderCount!: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  margin!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conversionRate!: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  targetRevenue!: number | null;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  achievementPct!: number | null;

  @CreateDateColumn()
  calculatedAt!: Date;
}
