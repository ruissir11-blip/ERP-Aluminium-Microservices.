import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Quote } from './Quote';
import { AluminumProfile } from './AluminumProfile';

@Entity('quote_lines')
@Index(['quoteId'])
@Index(['profileId'])
@Index(['quoteId', 'sortOrder'])
export class QuoteLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'quote_id' })
  quoteId!: string;

  @ManyToOne(() => Quote, (quote) => quote.lines)
  @JoinColumn({ name: 'quote_id' })
  quote!: Quote;

  @Column({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_length' })
  unitLength!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'unit_weight' })
  unitWeight!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'total_weight' })
  totalWeight!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, name: 'unit_surface' })
  unitSurface?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'total_surface' })
  totalSurface?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'material_cost' })
  materialCost!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'unit_price' })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, name: 'line_discount' })
  lineDiscount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, name: 'line_total' })
  lineTotal!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;
}
