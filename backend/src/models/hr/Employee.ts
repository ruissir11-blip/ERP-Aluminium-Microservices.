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
import { EmployeeContract } from './EmployeeContract';
import { LeaveRequest } from './LeaveRequest';
import { Attendance } from './Attendance';
import { Payslip } from './Payslip';
import { PerformanceReview } from './PerformanceReview';
import { TrainingEnrollment } from './TrainingEnrollment';
import { EmployeePost } from './EmployeePost';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  ON_LEAVE = 'ON_LEAVE',
}

@Entity('employees')
@Index(['employeeNumber'], { unique: true })
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['departmentId'])
@Index(['hireDate'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'employee_number' })
  employeeNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 100, default: 'France' })
  country: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'emergency_contact' })
  emergencyContact: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'national_id' })
  nationalId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'bank_account' })
  bankAccount: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'social_security_number' })
  socialSecurityNumber: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId: string | null;

  @ManyToOne(() => Department, (dept) => dept.employees, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'date', nullable: true, name: 'hire_date' })
  hireDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'termination_date' })
  terminationDate: Date | null;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
    name: 'status',
  })
  status: EmployeeStatus;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'photo_url' })
  photoUrl: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => EmployeeContract, (contract) => contract.employee)
  contracts: EmployeeContract[];

  @OneToMany(() => EmployeePost, (empPost) => empPost.employee)
  employeePosts: EmployeePost[];

  @OneToMany(() => LeaveRequest, (leave) => leave.employee)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @OneToMany(() => Payslip, (payslip) => payslip.employee)
  payslips: Payslip[];

  @OneToMany(() => PerformanceReview, (review) => review.employee)
  performanceReviews: PerformanceReview[];

  @OneToMany(() => TrainingEnrollment, (enrollment) => enrollment.employee)
  trainingEnrollments: TrainingEnrollment[];

  // Helper method
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
