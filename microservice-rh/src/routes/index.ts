import { Router } from 'express';
import { employeeController } from '../controllers/hr/EmployeeController';
import { departmentController } from '../controllers/hr/DepartmentController';
import { leaveController } from '../controllers/hr/LeaveController';
import { contractController } from '../controllers/hr/ContractController';
import { attendanceController } from '../controllers/hr/AttendanceController';
import { payslipController } from '../controllers/hr/PayslipController';
import { authenticate } from '../middleware/auth'; // Assume proxy auth or minimal
import { requirePermission } from '../middleware/rbac'; // Minimal RBAC for HR

const router = Router();

// All HR routes require authentication (via proxy headers/JWT)
router.use(authenticate);

// ==================== EMPLOYEES ====================
router.get('/employees', requirePermission('hr', 'read'), employeeController.listEmployees);
router.get('/employees/stats', requirePermission('hr', 'read'), employeeController.getEmployeeStats);
router.get('/employees/:id', requirePermission('hr', 'read'), employeeController.getEmployeeById);
router.post('/employees', requirePermission('hr', 'create'), employeeController.createEmployee);
router.put('/employees/:id', requirePermission('hr', 'update'), employeeController.updateEmployee);
router.delete('/employees/:id', requirePermission('hr', 'delete'), employeeController.archiveEmployee);

// ==================== DEPARTMENTS ====================
router.get('/departments', requirePermission('hr', 'read'), departmentController.listDepartments);
router.get('/departments/hierarchy', requirePermission('hr', 'read'), departmentController.getDepartmentHierarchy);
router.get('/departments/:id', requirePermission('hr', 'read'), departmentController.getDepartmentById);
router.post('/departments', requirePermission('hr', 'create'), departmentController.createDepartment);
router.put('/departments/:id', requirePermission('hr', 'update'), departmentController.updateDepartment);
router.delete('/departments/:id', requirePermission('hr', 'delete'), departmentController.deleteDepartment);

// ==================== CONTRACTS ====================
router.get('/contracts', requirePermission('hr', 'read'), contractController.listContracts);
router.get('/contracts/:id', requirePermission('hr', 'read'), contractController.getContractById);
router.get('/employees/:employeeId/contracts', requirePermission('hr', 'read'), contractController.getEmployeeContracts);
router.post('/contracts', requirePermission('hr', 'create'), contractController.createContract);
router.put('/contracts/:id', requirePermission('hr', 'update'), contractController.updateContract);
router.post('/contracts/:id/renew', requirePermission('hr', 'update'), contractController.renewContract);
router.post('/contracts/:id/terminate', requirePermission('hr', 'update'), contractController.terminateContract);

// ==================== LEAVE REQUESTS ====================
router.get('/leave-requests', requirePermission('hr', 'read'), leaveController.listLeaveRequests);
router.get('/leave-requests/:id', requirePermission('hr', 'read'), leaveController.getLeaveRequestById);
router.get('/employees/:employeeId/leave-balance', requirePermission('hr', 'read'), leaveController.getLeaveBalance);
router.post('/leave-requests', requirePermission('hr', 'create'), leaveController.createLeaveRequest);
router.put('/leave-requests/:id', requirePermission('hr', 'update'), leaveController.updateLeaveRequest);
router.put('/leave-requests/:id/approve', requirePermission('hr', 'approve'), leaveController.approveLeaveRequest);
router.put('/leave-requests/:id/reject', requirePermission('hr', 'approve'), leaveController.rejectLeaveRequest);
router.delete('/leave-requests/:id', requirePermission('hr', 'update'), leaveController.cancelLeaveRequest);

// ==================== ATTENDANCE ====================
router.get('/attendances', requirePermission('hr', 'read'), attendanceController.listAttendances);
router.get('/attendances/:id', requirePermission('hr', 'read'), attendanceController.getAttendanceById);
router.get('/attendances/today', requirePermission('hr', 'read'), attendanceController.getTodayAttendance);
router.get('/attendances/report', requirePermission('hr', 'read'), attendanceController.getAttendanceReport);
router.post('/attendances/check-in', requirePermission('hr', 'create'), attendanceController.checkIn);
router.post('/attendances/check-out', requirePermission('hr', 'create'), attendanceController.checkOut);
router.post('/attendances', requirePermission('hr', 'create'), attendanceController.createAttendance);

// ==================== PAYSLIPS ====================
router.get('/payslips', requirePermission('hr', 'read'), payslipController.listPayslips);
router.get('/payslips/:id', requirePermission('hr', 'read'), payslipController.getPayslipById);
router.post('/payslips/generate', requirePermission('hr', 'create'), payslipController.generatePayslip);
router.post('/payslips/generate-batch', requirePermission('hr', 'create'), payslipController.generateBatchPayslips);
router.put('/payslips/:id/validate', requirePermission('hr', 'update'), payslipController.validatePayslip);
router.put('/payslips/:id/mark-paid', requirePermission('hr', 'update'), payslipController.markAsPaid);

export default router;

