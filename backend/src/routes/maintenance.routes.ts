import { Router } from 'express';
import { MachineController } from '../controllers/maintenance/MachineController';
import { WorkOrderController } from '../controllers/maintenance/WorkOrderController';
import { MetricsController } from '../controllers/maintenance/MetricsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Initialize controllers
const machineController = new MachineController();
const workOrderController = new WorkOrderController();
const metricsController = new MetricsController();

// Apply authentication to all maintenance routes
router.use(authenticate);

// ==================== Machine Routes ====================

// GET /api/v1/maintenance/machines - List all machines
router.get('/machines', (req, res) => machineController.listMachines(req, res));

// GET /api/v1/maintenance/machines/active - List active machines
router.get('/machines/active', (req, res) => machineController.listActiveMachines(req, res));

// GET /api/v1/maintenance/machines/broken-down - List broken down machines
router.get('/machines/broken-down', (req, res) => machineController.listBrokenDownMachines(req, res));

// GET /api/v1/maintenance/machines/needing-maintenance - List machines needing maintenance
router.get('/machines/needing-maintenance', (req, res) => machineController.listNeedingMaintenance(req, res));

// GET /api/v1/maintenance/machines/:id - Get machine by ID
router.get('/machines/:id', (req, res) => machineController.getMachine(req, res));

// POST /api/v1/maintenance/machines - Create new machine
router.post('/machines', (req, res) => machineController.createMachine(req, res));

// PUT /api/v1/maintenance/machines/:id - Update machine
router.put('/machines/:id', (req, res) => machineController.updateMachine(req, res));

// PATCH /api/v1/maintenance/machines/:id/status - Update machine status
router.patch('/machines/:id/status', (req, res) => machineController.updateStatus(req, res));

// POST /api/v1/maintenance/machines/:id/archive - Archive machine
router.post('/machines/:id/archive', (req, res) => machineController.archiveMachine(req, res));

// POST /api/v1/maintenance/machines/:id/reactivate - Reactivate machine
router.post('/machines/:id/reactivate', (req, res) => machineController.reactivateMachine(req, res));

// POST /api/v1/maintenance/machines/:id/hours - Update operational hours
router.post('/machines/:id/hours', (req, res) => machineController.updateOperationalHours(req, res));

// POST /api/v1/maintenance/machines/:id/documents - Add document to machine
router.post('/machines/:id/documents', (req, res) => machineController.addDocument(req, res));

// ==================== Work Order Routes ====================

// GET /api/v1/maintenance/work-orders - List all work orders
router.get('/work-orders', (req, res) => workOrderController.listWorkOrders(req, res));

// GET /api/v1/maintenance/work-orders/overdue - List overdue work orders
router.get('/work-orders/overdue', (req, res) => workOrderController.listOverdueWorkOrders(req, res));

// GET /api/v1/maintenance/work-orders/technician/:userId - List work orders for technician
router.get('/work-orders/technician/:userId', (req, res) => workOrderController.listByTechnician(req, res));

// GET /api/v1/maintenance/work-orders/:id - Get work order by ID
router.get('/work-orders/:id', (req, res) => workOrderController.getWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders - Create new work order
router.post('/work-orders', (req, res) => workOrderController.createWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/breakdown - Report breakdown
router.post('/work-orders/breakdown', (req, res) => workOrderController.reportBreakdown(req, res));

// PUT /api/v1/maintenance/work-orders/:id - Update work order
router.put('/work-orders/:id', (req, res) => workOrderController.updateWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/:id/assign - Assign work order
router.post('/work-orders/:id/assign', (req, res) => workOrderController.assignWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/:id/start - Start work
router.post('/work-orders/:id/start', (req, res) => workOrderController.startWork(req, res));

// POST /api/v1/maintenance/work-orders/:id/complete - Complete work order
router.post('/work-orders/:id/complete', (req, res) => workOrderController.completeWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/:id/close - Close work order
router.post('/work-orders/:id/close', (req, res) => workOrderController.closeWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/:id/cancel - Cancel work order
router.post('/work-orders/:id/cancel', (req, res) => workOrderController.cancelWorkOrder(req, res));

// POST /api/v1/maintenance/work-orders/:id/acknowledge - Acknowledge breakdown
router.post('/work-orders/:id/acknowledge', (req, res) => workOrderController.acknowledgeBreakdown(req, res));

// ==================== Metrics Routes ====================

// GET /api/v1/maintenance/metrics/trs/:machineId - Get TRS for machine
router.get('/metrics/trs/:machineId', (req, res) => metricsController.getTRS(req, res));

// GET /api/v1/maintenance/metrics/mtbf/:machineId - Get MTBF for machine
router.get('/metrics/mtbf/:machineId', (req, res) => metricsController.getMTBF(req, res));

// GET /api/v1/maintenance/metrics/mttr/:machineId - Get MTTR for machine
router.get('/metrics/mttr/:machineId', (req, res) => metricsController.getMTTR(req, res));

// GET /api/v1/maintenance/metrics/kpis/:machineId - Get KPIs for machine
router.get('/metrics/kpis/:machineId', (req, res) => metricsController.getKPIs(req, res));

// GET /api/v1/maintenance/metrics/all - Get all machine metrics
router.get('/metrics/all', (req, res) => metricsController.getAllMachineMetrics(req, res));

// GET /api/v1/maintenance/metrics/ratio - Get preventive/corrective ratio
router.get('/metrics/ratio', (req, res) => metricsController.getPreventiveCorrectiveRatio(req, res));

export default router;
