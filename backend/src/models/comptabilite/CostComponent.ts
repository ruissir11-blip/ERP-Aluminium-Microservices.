import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CostComponentType {
  MATERIAL = 'material',
  LABOR = 'labor',
  OVERHEAD = 'overhead',
}

@Entity('cost_component')
@Index('idx_cost_component_type', ['type'])
@Index('idx_cost_component_active', ['isActive'])
export class CostComponent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({
    type: 'varchar',
    length: '20',
  })
  type!: CostComponentType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  rate!: number;

  @Column({ length: 50 })
  unit!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
