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
import { Employee } from './Employee';

@Entity('departments')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['isActive'])
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'manager_id' })
  managerId: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_department_id' })
  parentDepartmentId: string | null;

  @ManyToOne(() => Department, (dept) => dept.children, { nullable: true })
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment: Department | null;

  @OneToMany(() => Department, (dept) => dept.parentDepartment)
  children: Department[];

  @OneToMany(() => Employee, (emp) => emp.department)
  employees: Employee[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
