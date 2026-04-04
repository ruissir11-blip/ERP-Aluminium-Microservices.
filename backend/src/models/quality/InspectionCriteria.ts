import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InspectionPoint } from './InspectionPoint';

@Entity('inspection_criteria')
export class InspectionCriteria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  inspection_point_id!: string;

  @ManyToOne(() => InspectionPoint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_point_id' })
  inspectionPoint!: InspectionPoint;

  @Column({ type: 'varchar', length: 100 })
  parameter_name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  nominal_value!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  tolerance_min!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  tolerance_max!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
