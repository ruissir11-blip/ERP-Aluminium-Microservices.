import { Router } from 'express';
import { ProductCostController } from '../controllers/comptabilite/ProductCostController';
import { OrderCostingController } from '../controllers/comptabilite/OrderCostingController';
import { CustomerProfitabilityController } from '../controllers/comptabilite/CustomerProfitabilityController';
import { CommercialPerformanceController } from '../controllers/comptabilite/CommercialPerformanceController';
import { KPIController } from '../controllers/comptabilite/KPIController';
import { ROIController } from '../controllers/comptabilite/ROIController';

const router = Router();

// Instantiate controllers
const productCostController = new ProductCostController();
const orderCostingController = new OrderCostingController();
const customerProfitabilityController = new CustomerProfitabilityController();
const commercialPerformanceController = new CommercialPerformanceController();
const kpiController = new KPIController();
const roiController = new ROIController();

// Cost Component Routes removed

// Product Cost Routes
router.get('/product-costs', (req, res) => productCostController.list(req, res));
router.get('/product-costs/:profileId', (req, res) => productCostController.getByProfileId(req, res));
router.post('/costs/recalculate', (req, res) => productCostController.recalculate(req, res));

// Order Costing Routes
router.get('/orders', (req, res) => orderCostingController.getAll(req, res));
router.get('/orders/:id/costing', (req, res) => orderCostingController.getByOrderId(req, res));
router.post('/orders/:id/recalculate-costing', (req, res) => orderCostingController.recalculate(req, res));

// Customer Profitability Routes
router.get('/customers/profitability', (req, res) => customerProfitabilityController.getAll(req, res));
router.get('/customers/:id/profitability', (req, res) => customerProfitabilityController.getByCustomerId(req, res));
router.post('/customers/:id/recalculate-profitability', (req, res) => customerProfitabilityController.recalculate(req, res));

// Commercial Performance Routes
router.get('/commercials/performance', (req, res) => commercialPerformanceController.getAll(req, res));
router.get('/commercials/:id/performance', (req, res) => commercialPerformanceController.getByCommercialId(req, res));
router.get('/commercials/leaderboard', (req, res) => commercialPerformanceController.getLeaderboard(req, res));
router.post('/commercials/recalculate', (req, res) => commercialPerformanceController.recalculate(req, res));

// KPI Routes
router.get('/kpis/dso', (req, res) => kpiController.getDSO(req, res));
router.get('/kpis/aging', (req, res) => kpiController.getAging(req, res));
router.get('/kpis/dashboard', (req, res) => kpiController.getDashboard(req, res));
router.post('/kpis/recalculate', (req, res) => kpiController.recalculate(req, res));

// ROI Routes
router.get('/roi/:equipmentId', (req, res) => roiController.getByEquipmentId(req, res));
router.post('/roi/calculate', (req, res) => roiController.calculate(req, res));
router.post('/roi/compare', (req, res) => roiController.compare(req, res));

export default router;
