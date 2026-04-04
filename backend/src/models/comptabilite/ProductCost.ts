import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';

@Entity('product_cost')
@Index('idx_product_cost_profile', ['profileId'])
@Index('idx_product_cost_calculated', ['calculatedAt'])
export class ProductCost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  materialCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  laborCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  overheadCost!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalCost!: number;

  @CreateDateColumn()
  calculatedAt!: Date;
}
