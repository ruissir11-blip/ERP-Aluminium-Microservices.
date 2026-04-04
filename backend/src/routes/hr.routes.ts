import { Router } from 'express';
import { employeeController } from '../controllers/hr/EmployeeController';
import { departmentController } from '../controllers/hr/DepartmentController';
import { leaveController } from '../controllers/hr/LeaveController';
import { contractController } from '../controllers/hr/ContractController';
import { attendanceController } from '../controllers/hr/AttendanceController';
import { payslipController } from '../controllers/hr/PayslipController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// ==================== EMPLOYEES ====================
// List employees (with pagination and filters)
router.get('/employees', requirePermission('hr', 'read'), employeeController.listEmployees);
// Get employee statistics for dashboard
router.get('/employees/stats', requirePermission('hr', 'read'), employeeController.getEmployeeStats);
// Get employee by ID
router.get('/employees/:id', requirePermission('hr', 'read'), employeeController.getEmployeeById);
// Create new employee
router.post('/employees', requirePermission('hr', 'create'), employeeController.createEmployee);
// Update employee
router.put('/employees/:id', requirePermission('hr', 'update'), employeeController.updateEmployee);
// Archive employee (soft delete)
router.delete('/employees/:id', requirePermission('hr', 'delete'), employeeController.archiveEmployee);

// ==================== DEPARTMENTS ====================
// List departments
router.get('/departments', requirePermission('hr', 'read'), departmentController.listDepartments);
// Get department hierarchy
router.get('/departments/hierarchy', requirePermission('hr', 'read'), departmentController.getDepartmentHierarchy);
// Get department by ID
router.get('/departments/:id', requirePermission('hr', 'read'), departmentController.getDepartmentById);
// Create new department
router.post('/departments', requirePermission('hr', 'create'), departmentController.createDepartment);
// Update department
router.put('/departments/:id', requirePermission('hr', 'update'), departmentController.updateDepartment);
// Delete (deactivate) department
router.delete('/departments/:id', requirePermission('hr', 'delete'), departmentController.deleteDepartment);

// ==================== CONTRACTS ====================
// List contracts
router.get('/contracts', requirePermission('hr', 'read'), contractController.listContracts);
// Get contract by ID
router.get('/contracts/:id', requirePermission('hr', 'read'), contractController.getContractById);
// Get employee's contracts
router.get('/employees/:employeeId/contracts', requirePermission('hr', 'read'), contractController.getEmployeeContracts);
// Create new contract
router.post('/contracts', requirePermission('hr', 'create'), contractController.createContract);
// Update contract
router.put('/contracts/:id', requirePermission('hr', 'update'), contractController.updateContract);
// Renew contract
router.post('/contracts/:id/renew', requirePermission('hr', 'update'), contractController.renewContract);
// Terminate contract
router.post('/contracts/:id/terminate', requirePermission('hr', 'update'), contractController.terminateContract);

// ==================== LEAVE REQUESTS ====================
// List leave requests
router.get('/leave-requests', requirePermission('hr', 'read'), leaveController.listLeaveRequests);
// Get leave request by ID
router.get('/leave-requests/:id', requirePermission('hr', 'read'), leaveController.getLeaveRequestById);
// Get leave balance for employee
router.get('/employees/:employeeId/leave-balance', requirePermission('hr', 'read'), leaveController.getLeaveBalance);
// Create new leave request
router.post('/leave-requests', requirePermission('hr', 'create'), leaveController.createLeaveRequest);
// Update leave request
router.put('/leave-requests/:id', requirePermission('hr', 'update'), leaveController.updateLeaveRequest);
// Approve leave request
router.put('/leave-requests/:id/approve', requirePermission('hr', 'approve'), leaveController.approveLeaveRequest);
// Reject leave request
router.put('/leave-requests/:id/reject', requirePermission('hr', 'approve'), leaveController.rejectLeaveRequest);
// Cancel leave request
router.delete('/leave-requests/:id', requirePermission('hr', 'update'), leaveController.cancelLeaveRequest);

// ==================== ATTENDANCE ====================
// List attendances
router.get('/attendances', requirePermission('hr', 'read'), attendanceController.listAttendances);
// Get attendance by ID
router.get('/attendances/:id', requirePermission('hr', 'read'), attendanceController.getAttendanceById);
// Get today's attendance for employee
router.get('/attendances/today', requirePermission('hr', 'read'), attendanceController.getTodayAttendance);
// Get attendance report
router.get('/attendances/report', requirePermission('hr', 'read'), attendanceController.getAttendanceReport);
// Check in
router.post('/attendances/check-in', requirePermission('hr', 'create'), attendanceController.checkIn);
// Check out
router.post('/attendances/check-out', requirePermission('hr', 'create'), attendanceController.checkOut);
// Create/update attendance manually
router.post('/attendances', requirePermission('hr', 'create'), attendanceController.createAttendance);

// ==================== POSTES ====================
// TODO: Add poste routes

// ==================== TRAINING ====================
// TODO: Add training routes

// ==================== PERFORMANCE ====================
// TODO: Add performance review routes

// ==================== RECRUITMENT ====================
// TODO: Add recruitment routes

// ==================== PAYSLIPS ====================
// List payslips
router.get('/payslips', requirePermission('hr', 'read'), payslipController.listPayslips);
// Get payslip by ID
router.get('/payslips/:id', requirePermission('hr', 'read'), payslipController.getPayslipById);
// Generate payslip for employee
router.post('/payslips/generate', requirePermission('hr', 'create'), payslipController.generatePayslip);
// Generate batch payslips for all employees
router.post('/payslips/generate-batch', requirePermission('hr', 'create'), payslipController.generateBatchPayslips);
// Validate payslip
router.put('/payslips/:id/validate', requirePermission('hr', 'update'), payslipController.validatePayslip);
// Mark as paid
router.put('/payslips/:id/mark-paid', requirePermission('hr', 'update'), payslipController.markAsPaid);

export default router;
