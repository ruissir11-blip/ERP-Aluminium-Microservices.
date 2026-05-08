import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

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

// Export only one DataSource instance for migration CLI
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aluminium',
  synchronize: false,
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
    Employee,
    Department,
    Poste,
    EmployeePost,
    EmployeeContract,
    LeaveRequest,
    Attendance,
    Payslip,
    Training,
    TrainingSession,
    TrainingEnrollment,
    PerformanceReview,
    RecruitmentJob,
    RecruitmentCandidate,
  ],
  migrations: ['src/migrations/**/*.{ts,js}'],
  subscribers: [],
});
