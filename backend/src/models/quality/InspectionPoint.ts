import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ProductionStage {
  CUTTING = 'cutting',
  ASSEMBLY = 'assembly',
  FINISHING = 'finishing',
  PACKING = 'packing',
  SHIPPING = 'shipping',
}

@Entity('inspection_points')
export class InspectionPoint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  production_stage!: ProductionStage;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  criteria_json!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  is_mandatory!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
