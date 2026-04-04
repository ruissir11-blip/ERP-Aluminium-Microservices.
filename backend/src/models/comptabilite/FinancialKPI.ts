import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FinancialKPIType {
  REVENUE_GROSS = 'revenue_gross',
  REVENUE_NET = 'revenue_net',
  MARGIN_GROSS = 'margin_gross',
  MARGIN_NET = 'margin_net',
  DSO = 'dso',
  RECEIVABLES = 'receivables',
}

@Entity('financial_kpi')
@Index('idx_financial_kpi_type', ['kpiType'])
@Index('idx_financial_kpi_period', ['period'])
export class FinancialKPI {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: '50',
  })
  kpiType!: FinancialKPIType;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  value!: number;

  @Column({
    type: 'varchar',
    length: '20',
  })
  period!: string;

  @CreateDateColumn()
  calculatedAt!: Date;
}
