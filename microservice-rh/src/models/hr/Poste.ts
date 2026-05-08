import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Department } from './Department';
import { EmployeePost } from './EmployeePost';

@Entity('postes')
@Index(['code'], { unique: true })
@Index(['departmentId'])
@Index(['isActive'])
export class Poste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId: string | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'job_level' })
  jobLevel: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'min_salary' })
  minSalary: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'max_salary' })
  maxSalary: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => EmployeePost, (empPost) => empPost.poste)
  employeePosts: EmployeePost[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
