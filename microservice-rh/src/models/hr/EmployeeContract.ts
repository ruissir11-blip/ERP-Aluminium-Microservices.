import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  APPRENTICE = 'APPRENTICE',
  INTERIM = 'INTERIM',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

@Entity('employee_contracts')
@Index(['employeeId'])
@Index(['status'])
@Index(['startDate'])
export class EmployeeContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.contracts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: ContractType,
    name: 'contract_type',
  })
  contractType: ContractType;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'base_salary' })
  baseSalary: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'work_schedule' })
  workSchedule: string | null;

  @Column({ type: 'integer', name: 'weekly_hours' })
  weeklyHours: number;

  @Column({ type: 'date', nullable: true, name: 'renewal_date' })
  renewalDate: Date | null;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
    name: 'status',
  })
  status: ContractStatus;

  @Column({ type: 'text', nullable: true })
  terms: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
