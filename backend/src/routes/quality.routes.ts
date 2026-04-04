import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  validate,
  validateQuery,
  createInspectionPointSchema,
  updateInspectionPointSchema,
  createInspectionRecordSchema,
  updateInspectionRecordSchema,
  createNonConformitySchema,
  updateNonConformitySchema,
  createCorrectiveActionSchema,
  updateCorrectiveActionSchema,
  createRootCauseSchema,
  updateRootCauseSchema,
  createQualityDecisionSchema,
  updateQualityDecisionSchema,
  statisticsQuerySchema,
  weeklyReportQuerySchema,
  monthlyReportQuerySchema,
} from '../middleware/qualityValidation';
import {
  inspectionPointController,
  inspectionRecordController,
  nonConformityController,
  correctiveActionController,
  ncRootCauseController,
  qualityDecisionController,
  qualityStatisticsController,
  qualityReportController,
} from '../controllers/quality';

const router = Router();

// All quality routes require authentication
const authMiddleware = [authenticate];

// Inspection Points routes
router.get('/inspection-points', authMiddleware, (req: Request, res: Response) => inspectionPointController.getAll(req, res));
router.get('/inspection-points/:id', authMiddleware, (req: Request, res: Response) => inspectionPointController.getById(req, res));
router.post('/inspection-points', authMiddleware, validate(createInspectionPointSchema), (req: Request, res: Response) => inspectionPointController.create(req, res));
router.put('/inspection-points/:id', authMiddleware, validate(updateInspectionPointSchema), (req: Request, res: Response) => inspectionPointController.update(req, res));
router.delete('/inspection-points/:id', authMiddleware, (req: Request, res: Response) => inspectionPointController.delete(req, res));

// Inspection Records routes
router.get('/inspection-records', authMiddleware, (req: Request, res: Response) => inspectionRecordController.getAll(req, res));
router.get('/inspection-records/:id', authMiddleware, (req: Request, res: Response) => inspectionRecordController.getById(req, res));
router.get('/inspection-records/production-order/:productionOrderId', authMiddleware, (req: Request, res: Response) => inspectionRecordController.getByProductionOrder(req, res));
router.post('/inspection-records', authMiddleware, validate(createInspectionRecordSchema), (req: Request, res: Response) => inspectionRecordController.create(req, res));
router.put('/inspection-records/:id', authMiddleware, validate(updateInspectionRecordSchema), (req: Request, res: Response) => inspectionRecordController.update(req, res));
router.post('/inspection-records/:id/complete', authMiddleware, (req: Request, res: Response) => inspectionRecordController.complete(req, res));
router.get('/inspection-records/statistics', authMiddleware, (req: Request, res: Response) => inspectionRecordController.getStatistics(req, res));

// Non-Conformities routes
router.get('/non-conformities', authMiddleware, (req: Request, res: Response) => nonConformityController.getAll(req, res));
router.get('/non-conformities/priority', authMiddleware, (req: Request, res: Response) => nonConformityController.getOpenByPriority(req, res));
router.get('/non-conformities/:id', authMiddleware, (req: Request, res: Response) => nonConformityController.getById(req, res));
router.get('/non-conformities/nc-number/:ncNumber', authMiddleware, (req: Request, res: Response) => nonConformityController.getByNCNumber(req, res));
router.get('/non-conformities/lot/:lotNumber', authMiddleware, (req: Request, res: Response) => nonConformityController.getByLot(req, res));
router.post('/non-conformities', authMiddleware, validate(createNonConformitySchema), (req: Request, res: Response) => nonConformityController.create(req, res));
router.put('/non-conformities/:id', authMiddleware, validate(updateNonConformitySchema), (req: Request, res: Response) => nonConformityController.update(req, res));
router.post('/non-conformities/:id/close', authMiddleware, (req: Request, res: Response) => nonConformityController.close(req, res));
router.get('/non-conformities/statistics', authMiddleware, (req: Request, res: Response) => nonConformityController.getStatistics(req, res));

// Corrective Actions routes
router.get('/corrective-actions', authMiddleware, (req: Request, res: Response) => correctiveActionController.getAll(req, res));
router.get('/corrective-actions/upcoming', authMiddleware, (req: Request, res: Response) => correctiveActionController.getUpcoming(req, res));
router.get('/corrective-actions/:id', authMiddleware, (req: Request, res: Response) => correctiveActionController.getById(req, res));
router.get('/corrective-actions/nc/:ncId', authMiddleware, (req: Request, res: Response) => correctiveActionController.getByNC(req, res));
router.post('/corrective-actions', authMiddleware, validate(createCorrectiveActionSchema), (req: Request, res: Response) => correctiveActionController.create(req, res));
router.put('/corrective-actions/:id', authMiddleware, validate(updateCorrectiveActionSchema), (req: Request, res: Response) => correctiveActionController.update(req, res));
router.post('/corrective-actions/:id/complete', authMiddleware, (req: Request, res: Response) => correctiveActionController.complete(req, res));
router.post('/corrective-actions/:id/verify', authMiddleware, (req: Request, res: Response) => correctiveActionController.verify(req, res));

// Root Cause Analysis routes
router.get('/root-causes', authMiddleware, (req: Request, res: Response) => ncRootCauseController.getAll(req, res));
router.get('/root-causes/:id', authMiddleware, (req: Request, res: Response) => ncRootCauseController.getById(req, res));
router.get('/root-causes/nc/:ncId', authMiddleware, (req: Request, res: Response) => ncRootCauseController.getByNC(req, res));
router.post('/root-causes', authMiddleware, validate(createRootCauseSchema), (req: Request, res: Response) => ncRootCauseController.create(req, res));
router.put('/root-causes/:id', authMiddleware, validate(updateRootCauseSchema), (req: Request, res: Response) => ncRootCauseController.update(req, res));
router.delete('/root-causes/:id', authMiddleware, (req: Request, res: Response) => ncRootCauseController.delete(req, res));
router.post('/root-causes/nc/:ncId/cinq-pourquoi', authMiddleware, (req: Request, res: Response) => ncRootCauseController.addCinqPourquoi(req, res));
router.post('/root-causes/nc/:ncId/ishikawa', authMiddleware, (req: Request, res: Response) => ncRootCauseController.addIshikawa(req, res));
router.get('/root-causes/statistics', authMiddleware, (req: Request, res: Response) => ncRootCauseController.getStatistics(req, res));

// Quality Decisions routes
router.get('/quality-decisions', authMiddleware, (req: Request, res: Response) => qualityDecisionController.getAll(req, res));
router.get('/quality-decisions/pending', authMiddleware, (req: Request, res: Response) => qualityDecisionController.getPendingApprovals(req, res));
router.get('/quality-decisions/:id', authMiddleware, (req: Request, res: Response) => qualityDecisionController.getById(req, res));
router.get('/quality-decisions/nc/:ncId', authMiddleware, (req: Request, res: Response) => qualityDecisionController.getByNC(req, res));
router.post('/quality-decisions', authMiddleware, validate(createQualityDecisionSchema), (req: Request, res: Response) => qualityDecisionController.create(req, res));
router.put('/quality-decisions/:id', authMiddleware, validate(updateQualityDecisionSchema), (req: Request, res: Response) => qualityDecisionController.update(req, res));
router.post('/quality-decisions/:id/approve', authMiddleware, (req: Request, res: Response) => qualityDecisionController.approve(req, res));
router.post('/quality-decisions/:id/reject', authMiddleware, (req: Request, res: Response) => qualityDecisionController.reject(req, res));
router.get('/quality-decisions/statistics', authMiddleware, (req: Request, res: Response) => qualityDecisionController.getStatistics(req, res));

// Statistics routes
router.get('/statistics/nc-rate', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getNCRate(req, res));
router.get('/statistics/pareto/defect-type', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getParetoByDefectType(req, res));
router.get('/statistics/pareto/production-order', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getParetoByProductionOrder(req, res));
router.get('/statistics/pareto/lot', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getParetoByLot(req, res));
router.get('/statistics/kpis', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getKPIs(req, res));
router.get('/statistics/inspections', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getInspectionStatistics(req, res));
router.get('/statistics/corrective-actions', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getCorrectiveActionStatistics(req, res));
router.get('/statistics/decisions', authMiddleware, (req: Request, res: Response) => qualityStatisticsController.getDecisionStatistics(req, res));

// Reports routes
router.get('/reports/weekly', authMiddleware, (req: Request, res: Response) => qualityReportController.getWeeklyReport(req, res));
router.get('/reports/monthly', authMiddleware, (req: Request, res: Response) => qualityReportController.getMonthlyReport(req, res));
router.post('/reports/send-weekly', authMiddleware, (req: Request, res: Response) => qualityReportController.sendWeeklyReport(req, res));
router.post('/reports/send-monthly', authMiddleware, (req: Request, res: Response) => qualityReportController.sendMonthlyReport(req, res));

// Certificates routes
router.post('/certificates/generate', authMiddleware, (req: Request, res: Response) => qualityReportController.generateCertificate(req, res));

export default router;
