import { Request, Response } from 'express';
import { MetricsService } from '../../services/maintenance/MetricsService';
import { isValidUUID } from '../../utils/validators';

export class MetricsController {
  private metricsService: MetricsService;

  constructor() {
    this.metricsService = new MetricsService();
  }

  /**
   * GET /api/v1/maintenance/metrics/trs/:machineId
   * Get TRS metrics for a machine
   */
  async getTRS(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { startDate, endDate, plannedProductionTime, idealCycleTime, totalPieces, goodPieces } = req.query;

      if (!isValidUUID(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const trs = await this.metricsService.calculateTRS(
        machineId,
        new Date(startDate as string),
        new Date(endDate as string),
        plannedProductionTime ? parseInt(plannedProductionTime as string, 10) : 480,
        idealCycleTime ? parseFloat(idealCycleTime as string) : undefined,
        totalPieces ? parseInt(totalPieces as string, 10) : undefined,
        goodPieces ? parseInt(goodPieces as string, 10) : undefined
      );

      res.json({ data: trs });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to calculate TRS', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/mtbf/:machineId
   * Get MTBF metrics for a machine
   */
  async getMTBF(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { startDate, endDate } = req.query;

      if (!isValidUUID(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const mtbf = await this.metricsService.calculateMTBF(
        machineId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: mtbf });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to calculate MTBF', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/mttr/:machineId
   * Get MTTR metrics for a machine
   */
  async getMTTR(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { startDate, endDate } = req.query;

      if (!isValidUUID(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const mttr = await this.metricsService.calculateMTTR(
        machineId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: mttr });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to calculate MTTR', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/kpis/:machineId
   * Get comprehensive KPIs for a machine
   */
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { startDate, endDate } = req.query;

      if (!isValidUUID(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const kpis = await this.metricsService.getMaintenanceKPIs(
        machineId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: kpis });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch KPIs', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/all
   * Get metrics for all machines
   */
  async getAllMachineMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const metrics = await this.metricsService.getAllMachineMetrics(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: metrics });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all machine metrics', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/costs/:machineId
   * Get maintenance cost report for a machine
   */
  async getCostReport(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { startDate, endDate } = req.query;

      if (!isValidUUID(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const report = await this.metricsService.getMaintenanceCostReport(
        machineId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: report });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch cost report', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/metrics/ratio
   * Get preventive vs corrective ratio
   */
  async getPreventiveCorrectiveRatio(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const ratio = await this.metricsService.getPreventiveCorrectiveRatio(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ data: ratio });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate ratio', details: (error as Error).message });
    }
  }
}
