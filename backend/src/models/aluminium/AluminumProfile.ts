import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProfileType {
  PLAT = 'PLAT',
  TUBE = 'TUBE',
  CORNIERE = 'CORNIERE',
  UPN = 'UPN',
  IPE = 'IPE',
  CUSTOM = 'CUSTOM',
}

@Entity('aluminum_profiles')
@Index(['reference'], { unique: true })
@Index(['type'])
@Index(['isActive'])
export class AluminumProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ProfileType, default: ProfileType.CUSTOM })
  type!: ProfileType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  thickness?: number;

  @Column({ name: 'outer_width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  outerWidth?: number;

  @Column({ name: 'inner_width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  innerWidth?: number;

  @Column({ name: 'outer_height', type: 'decimal', precision: 10, scale: 2, nullable: true })
  outerHeight?: number;

  @Column({ name: 'inner_height', type: 'decimal', precision: 10, scale: 2, nullable: true })
  innerHeight?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  diameter?: number;

  @Column({ name: 'inner_diameter', type: 'decimal', precision: 10, scale: 2, nullable: true })
  innerDiameter?: number;

  @Column({ name: 'technical_specs', type: 'text', nullable: true })
  technicalSpecs?: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4 })
  unitPrice!: number;

  @Column({ name: 'weight_per_meter', type: 'decimal', precision: 10, scale: 4, nullable: true })
  weightPerMeter?: number;

  @Column({ name: 'surface_per_meter', type: 'decimal', precision: 10, scale: 4, nullable: true })
  surfacePerMeter?: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: '2.700' })
  density!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
