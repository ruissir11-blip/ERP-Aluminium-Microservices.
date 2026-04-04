import { Request, Response } from 'express';
import { qualityStatisticsService } from '../../services/quality/QualityStatisticsService';

/**
 * QualityStatisticsController
 * Handles all statistics and analytics endpoints for quality module
 */
export class QualityStatisticsController {
  /**
   * GET /api/v1/quality/statistics/nc-rate
   * Get NC rate statistics for a date range
   */
  async getNCRate(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.calculateNCRate(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error calculating NC rate',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/pareto/defect-type
   * Get Pareto analysis by defect type
   */
  async getParetoByDefectType(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getParetoByDefectType(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating Pareto analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/pareto/production-order
   * Get Pareto analysis by production order
   */
  async getParetoByProductionOrder(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getParetoByProductionOrder(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating Pareto analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/pareto/lot
   * Get Pareto analysis by lot number
   */
  async getParetoByLot(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getParetoByLot(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating Pareto analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/kpis
   * Get comprehensive quality KPIs
   */
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getQualityKPIs(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error calculating KPIs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/inspections
   * Get inspection statistics
   */
  async getInspectionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getInspectionStatistics(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting inspection statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/corrective-actions
   * Get corrective action statistics
   */
  async getCorrectiveActionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getCorrectiveActionStatistics(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting corrective action statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/statistics/decisions
   * Get quality decision statistics
   */
  async getDecisionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const result = await qualityStatisticsService.getQualityDecisionStatistics(start, end);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting decision statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const qualityStatisticsController = new QualityStatisticsController();
