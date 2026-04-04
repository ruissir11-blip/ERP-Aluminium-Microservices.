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

export enum PayslipStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  PAID = 'PAID',
}

@Entity('payslips')
@Index(['employeeId'])
@Index(['periodYear', 'periodMonth'])
@Index(['status'])
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.payslips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'integer', name: 'period_month' })
  periodMonth: number;

  @Column({ type: 'integer', name: 'period_year' })
  periodYear: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'base_salary' })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'overtime_pay' })
  overtimePay: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_salary' })
  netSalary: number;

  @Column({
    type: 'enum',
    enum: PayslipStatus,
    default: PayslipStatus.DRAFT,
    name: 'status',
  })
  status: PayslipStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
