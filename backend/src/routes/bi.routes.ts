import { Router } from 'express';
import { biDashboardController } from '../controllers/bi/BIDashboardController';

const router = Router();

// Dashboard routes
router.get('/dashboards', biDashboardController.getDashboards.bind(biDashboardController));
router.get('/dashboards/:id', biDashboardController.getDashboard.bind(biDashboardController));
router.get('/dashboards/:id/data', biDashboardController.getDashboardData.bind(biDashboardController));
router.post('/dashboards', biDashboardController.createDashboard.bind(biDashboardController));
router.put('/dashboards/:id', biDashboardController.updateDashboard.bind(biDashboardController));
router.delete('/dashboards/:id', biDashboardController.deleteDashboard.bind(biDashboardController));

// Seed default dashboards
router.post('/seed', biDashboardController.seedDashboards.bind(biDashboardController));

export default router;
