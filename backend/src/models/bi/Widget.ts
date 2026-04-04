import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BiDashboard } from './Dashboard';

export enum WidgetType {
  KPI_CARD = 'kpi_card',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  DATA_TABLE = 'data_table',
  GAUGE = 'gauge',
  HEAT_MAP = 'heat_map',
}

export enum WidgetDataSource {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  STOCK = 'stock',
  MAINTENANCE = 'maintenance',
  QUALITY = 'quality',
  COMPTABILITE = 'comptabilite',
  CUSTOM = 'custom',
}

@Entity('bi_widgets')
export class BiWidget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  dashboardId!: string;

  @ManyToOne(() => BiDashboard, (dashboard) => dashboard.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id' })
  dashboard!: BiDashboard;

  @Column({ length: 100 })
  title!: string;

  @Column({ length: 255, nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: WidgetType,
    default: WidgetType.KPI_CARD,
  })
  widgetType!: WidgetType;

  @Column({
    type: 'enum',
    enum: WidgetDataSource,
    default: WidgetDataSource.REVENUE,
  })
  dataSource!: WidgetDataSource;

  @Column('simple-json', { nullable: true })
  config!: {
    metric?: string;
    aggregation?: string;
    groupBy?: string;
    filters?: Record<string, unknown>;
    colors?: string[];
    showLegend?: boolean;
    showTrend?: boolean;
    decimalPlaces?: number;
  } | null;

  @Column('int', { default: 3 })
  width!: number;

  @Column('int', { default: 2 })
  height!: number;

  @Column('int', { default: 0 })
  positionX!: number;

  @Column('int', { default: 0 })
  positionY!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isLocked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
