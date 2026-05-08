import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Validate required database environment variables
const requiredDbVars = ['DB_USER', 'DB_PASSWORD'];
const missingVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
}

const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error('DB_PORT must be a valid port number (1-65535)');
}

// Import all entities
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Session } from '../models/Session';
import { AuditLog } from '../models/AuditLog';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { AluminumProfile } from '../models/aluminium/AluminumProfile';
import { Customer } from '../models/aluminium/Customer';
import { CustomerOrder } from '../models/aluminium/CustomerOrder';
import { Invoice } from '../models/aluminium/Invoice';
import { Quote } from '../models/aluminium/Quote';
import { QuoteLine } from '../models/aluminium/QuoteLine';
import { Machine } from '../models/maintenance/Machine';
import { MachineDocument } from '../models/maintenance/MachineDocument';
import { WorkOrder } from '../models/maintenance/WorkOrder';
import { WorkOrderPart } from '../models/maintenance/WorkOrderPart';
import { BreakdownRecord } from '../models/maintenance/BreakdownRecord';
import { InventoryItem } from '../models/stock/InventoryItem';
import { InventoryCount } from '../models/stock/InventoryCount';
import { InventoryCountLine } from '../models/stock/InventoryCountLine';
import { Lot } from '../models/stock/Lot';
import { LotTraceability } from '../models/stock/LotTraceability';
import { StockAlert } from '../models/stock/StockAlert';
import { StockLayer } from '../models/stock/StockLayer';
import { StockMovement } from '../models/stock/StockMovement';
import { StorageLocation } from '../models/stock/StorageLocation';
import { Warehouse } from '../models/stock/Warehouse';
import { InspectionPoint } from '../models/quality/InspectionPoint';
import { InspectionCriteria } from '../models/quality/InspectionCriteria';
import { InspectionRecord } from '../models/quality/InspectionRecord';
import { NonConformity } from '../models/quality/NonConformity';
import { NCRootCause } from '../models/quality/NCRootCause';
import { CorrectiveAction } from '../models/quality/CorrectiveAction';
import { QualityDecision } from '../models/quality/QualityDecision';
import { CertificateOfConformity } from '../models/quality/CertificateOfConformity';

// Re-export entities for external use
export { User } from '../models/User';
export { Role } from '../models/Role';
export { Session } from '../models/Session';
export { AuditLog } from '../models/AuditLog';
export { PasswordResetToken } from '../models/PasswordResetToken';
export { AluminumProfile } from '../models/aluminium/AluminumProfile';
export { Customer } from '../models/aluminium/Customer';
export { CustomerOrder } from '../models/aluminium/CustomerOrder';
export { Invoice } from '../models/aluminium/Invoice';
export { Quote } from '../models/aluminium/Quote';
export { QuoteLine } from '../models/aluminium/QuoteLine';
export { Machine } from '../models/maintenance/Machine';
export { MachineDocument } from '../models/maintenance/MachineDocument';
export { WorkOrder } from '../models/maintenance/WorkOrder';
export { WorkOrderPart } from '../models/maintenance/WorkOrderPart';
export { BreakdownRecord } from '../models/maintenance/BreakdownRecord';
export { InventoryItem } from '../models/stock/InventoryItem';
export { InventoryCount } from '../models/stock/InventoryCount';
export { InventoryCountLine } from '../models/stock/InventoryCountLine';
export { Lot } from '../models/stock/Lot';
export { LotTraceability } from '../models/stock/LotTraceability';
export { StockAlert } from '../models/stock/StockAlert';
export { StockLayer } from '../models/stock/StockLayer';
export { StockMovement } from '../models/stock/StockMovement';
export { StorageLocation } from '../models/stock/StorageLocation';
export { Warehouse } from '../models/stock/Warehouse';
export { InspectionPoint } from '../models/quality/InspectionPoint';
export { InspectionCriteria } from '../models/quality/InspectionCriteria';
export { InspectionRecord } from '../models/quality/InspectionRecord';
export { NonConformity } from '../models/quality/NonConformity';
export { NCRootCause } from '../models/quality/NCRootCause';
export { CorrectiveAction } from '../models/quality/CorrectiveAction';
export { QualityDecision } from '../models/quality/QualityDecision';
export { CertificateOfConformity } from '../models/quality/CertificateOfConformity';
// HR Module - REMOVED (now in microservice-rh)
    // export { Employee } from '../models/hr/Employee';
    // export { Department } from '../models/hr/Department';
export { Poste } from '../models/hr/Poste';
export { EmployeePost } from '../models/hr/EmployeePost';
export { EmployeeContract } from '../models/hr/EmployeeContract';
export { LeaveRequest } from '../models/hr/LeaveRequest';
export { Attendance } from '../models/hr/Attendance';
export { Payslip } from '../models/hr/Payslip';
export { Training } from '../models/hr/Training';
export { TrainingSession } from '../models/hr/TrainingSession';
export { TrainingEnrollment } from '../models/hr/TrainingEnrollment';
export { PerformanceReview } from '../models/hr/PerformanceReview';
export { RecruitmentJob } from '../models/hr/RecruitmentJob';
export { RecruitmentCandidate } from '../models/hr/RecruitmentCandidate';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aluminium',
  synchronize: false, // NEVER enable in production - use migrations only
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Role,
    Session,
    AuditLog,
    PasswordResetToken,
    AluminumProfile,
    Customer,
    CustomerOrder,
    Invoice,
    Quote,
    QuoteLine,
    Machine,
    MachineDocument,
    WorkOrder,
    WorkOrderPart,
    BreakdownRecord,
    InventoryItem,
    InventoryCount,
    InventoryCountLine,
    Lot,
    LotTraceability,
    StockAlert,
    StockLayer,
    StockMovement,
    StorageLocation,
    Warehouse,
    InspectionPoint,
    InspectionCriteria,
    InspectionRecord,
    NonConformity,
    NCRootCause,
    CorrectiveAction,
    QualityDecision,
    CertificateOfConformity,
    // HR Module entities are in microservice-rh - DO NOT add them here
  ],
  migrations: ['src/migrations/**/*.{ts,js}'],
  subscribers: [],
});

// Alias for backward compatibility
export const dataSource = AppDataSource;

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};
