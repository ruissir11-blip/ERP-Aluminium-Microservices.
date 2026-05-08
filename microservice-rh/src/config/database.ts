import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Import ONLY HR entities (standalone for microservice)
import { Employee } from '../models/hr/Employee';
import { Department } from '../models/hr/Department';
import { Poste } from '../models/hr/Poste';
import { EmployeePost } from '../models/hr/EmployeePost';
import { EmployeeContract } from '../models/hr/EmployeeContract';
import { LeaveRequest } from '../models/hr/LeaveRequest';
import { Attendance } from '../models/hr/Attendance';
import { Payslip } from '../models/hr/Payslip';
import { Training } from '../models/hr/Training';
import { TrainingSession } from '../models/hr/TrainingSession';
import { TrainingEnrollment } from '../models/hr/TrainingEnrollment';
import { PerformanceReview } from '../models/hr/PerformanceReview';
import { RecruitmentJob } from '../models/hr/RecruitmentJob';
import { RecruitmentCandidate } from '../models/hr/RecruitmentCandidate';

// Re-exports
export { Employee } from '../models/hr/Employee';
export { Department } from '../models/hr/Department';
// ... (export all others as needed)

const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const schema = process.env.DB_SCHEMA || 'rh_schema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aluminium',
  schema: schema, // TypeORM schema
  synchronize: process.env.NODE_ENV === 'development', // For dev only
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Employee, Department, Poste, EmployeePost, EmployeeContract,
    LeaveRequest, Attendance, Payslip, Training, TrainingSession,
    TrainingEnrollment, PerformanceReview, RecruitmentJob, RecruitmentCandidate,
  ],
  migrations: ['src/migrations/**/*.{ts,js}'],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log(`✅ RH Database connected (schema: ${schema})`);
  } catch (error) {
    console.error('❌ RH Database connection failed:', error);
    throw error;
  }
};

