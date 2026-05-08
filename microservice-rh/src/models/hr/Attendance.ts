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

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
}

@Entity('attendances')
@Index(['employeeId'])
@Index(['attendanceDate'])
@Index(['status'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date', name: 'attendance_date' })
  attendanceDate: Date;

  @Column({ type: 'time', nullable: true, name: 'check_in' })
  checkIn: string | null;

  @Column({ type: 'time', nullable: true, name: 'check_out' })
  checkOut: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'work_hours' })
  workHours: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'overtime_hours' })
  overtimeHours: number | null;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
    name: 'status',
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
