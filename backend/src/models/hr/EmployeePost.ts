import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';
import { Poste } from './Poste';

@Entity('employee_postes')
@Index(['employeeId'])
@Index(['posteId'])
@Index(['isPrimary'])
export class EmployeePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.employeePosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', name: 'poste_id' })
  posteId: string;

  @ManyToOne(() => Poste, (poste) => poste.employeePosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poste_id' })
  poste: Poste;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_primary' })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
