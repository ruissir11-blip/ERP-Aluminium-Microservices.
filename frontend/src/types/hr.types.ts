// HR Module Types

// ==================== EMPLOYEES ====================
export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  nationalId?: string;
  bankAccount?: string;
  socialSecurityNumber?: string;
  userId?: string;
  departmentId?: string;
  department?: Department;
  hireDate?: string;
  terminationDate?: string;
  status: EmployeeStatus;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  ON_LEAVE = 'ON_LEAVE',
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  nationalId?: string;
  bankAccount?: string;
  socialSecurityNumber?: string;
  departmentId?: string;
  hireDate?: string;
  status?: EmployeeStatus;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmployeeStatus;
  departmentId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EmployeeStats {
  total: number;
  byStatus: Array<{ status: string; count: string }>;
  byDepartment: Array<{ department: string; count: string }>;
}

// ==================== DEPARTMENTS ====================
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  manager?: Employee;
  managerName?: string;
  parentDepartmentId?: string;
  parentDepartment?: Department;
  children?: Department[];
  employees?: Employee[];
  employeeCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
}

// ==================== POSTES ====================
export interface Poste {
  id: string;
  code: string;
  title: string;
  description?: string;
  departmentId?: string;
  department?: Department;
  jobLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== CONTRACTS ====================
export interface EmployeeContract {
  id: string;
  employeeId: string;
  employee?: Employee;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  workSchedule?: string;
  weeklyHours: number;
  renewalDate?: string;
  status: ContractStatus;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface CreateContractDto {
  employeeId: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  workSchedule?: string;
  weeklyHours: number;
  terms?: string;
}

// ==================== LEAVE ====================
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approverId?: string;
  approver?: Employee;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface CreateLeaveRequestDto {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveBalance {
  employeeId: string;
  year: number;
  annualAllowance: number;
  usedDays: number;
  remainingDays: number;
}

// ==================== ATTENDANCE ====================
export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Employee;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
}

export interface AttendanceReport {
  records: Attendance[];
  summary: {
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
  };
}

// ==================== PAYSLIPS ====================
export interface Payslip {
  id: string;
  employeeId: string;
  employee?: Employee;
  periodMonth: number;
  periodYear: number;
  baseSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayslipStatus;
  createdAt: string;
}

export enum PayslipStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  PAID = 'PAID',
}

export interface GeneratePayslipDto {
  employeeId: string;
  periodMonth: number;
  periodYear: number;
}

export interface GenerateBatchPayslipDto {
  periodMonth: number;
  periodYear: number;
}

// ==================== TRAINING ====================
export interface Training {
  id: string;
  title: string;
  description?: string;
  provider?: string;
  durationHours?: number;
  certificationType?: string;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  training?: Training;
  scheduledDate: string;
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  status: TrainingSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export enum TrainingSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TrainingEnrollment {
  id: string;
  employeeId: string;
  employee?: Employee;
  sessionId: string;
  session?: TrainingSession;
  status: EnrollmentStatus;
  enrolledAt?: string;
  completedAt?: string;
  certificateUrl?: string;
  createdAt: string;
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// ==================== PERFORMANCE ====================
export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: Employee;
  reviewerId?: string;
  reviewer?: Employee;
  reviewDate: string;
  reviewPeriod?: string;
  ratingOverall?: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
}

// ==================== RECRUITMENT ====================
export interface RecruitmentJob {
  id: string;
  title: string;
  description: string;
  departmentId?: string;
  department?: Department;
  jobType?: string;
  location?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  publishDate?: string;
  closeDate?: string;
  status: RecruitmentJobStatus;
  createdAt: string;
  updatedAt: string;
}

export enum RecruitmentJobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export interface RecruitmentCandidate {
  id: string;
  jobId: string;
  job?: RecruitmentJob;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: CandidateStatus;
  applicationDate: string;
  createdAt: string;
  updatedAt: string;
}

export enum CandidateStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}
