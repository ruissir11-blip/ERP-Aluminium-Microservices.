import { Request, Response } from 'express';
import { commercialPerformanceService } from '../../services/comptabilite/CommercialPerformanceService';

export class CommercialPerformanceController {
  /**
   * GET /api/comptabilite/commercials/performance
   * Get all commercial performances
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', perPage = '10', period_start } = req.query;

      const periodStart = period_start ? new Date(period_start as string) : undefined;

      const result = await commercialPerformanceService.getAllPerformances({
        page: parseInt(page as string, 10),
        perPage: parseInt(perPage as string, 10),
        periodStart,
      });

      res.json({
        data: result.data,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching commercial performances:', error);
      res.status(500).json({ message: 'Error fetching commercial performances' });
    }
  }

  /**
   * GET /api/comptabilite/commercials/:id/performance
   * Get performance for a specific commercial
   */
  async getByCommercialId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { period_start, period_end } = req.query;

      const periodStart = period_start 
        ? new Date(period_start as string) 
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const periodEnd = period_end 
        ? new Date(period_end as string) 
        : new Date();

      const performance = await commercialPerformanceService.calculateCommercialPerformance(id, periodStart, periodEnd);

      res.json(performance);
    } catch (error) {
      console.error('Error fetching commercial performance:', error);
      res.status(500).json({ message: 'Error fetching commercial performance' });
    }
  }

  /**
   * GET /api/comptabilite/commercials/leaderboard
   * Get commercial leaderboard
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { period_start, limit = '10' } = req.query;

      const periodStart = period_start 
        ? new Date(period_start as string) 
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const leaderboard = await commercialPerformanceService.getLeaderboard(
        periodStart,
        parseInt(limit as string, 10)
      );

      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Error fetching leaderboard' });
    }
  }

  /**
   * POST /api/comptabilite/commercials/recalculate
   * Recalculate all commercial performances
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      const { period_start, period_end } = req.body;

      const periodStart = period_start 
        ? new Date(period_start) 
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const periodEnd = period_end 
        ? new Date(period_end) 
        : new Date();

      const count = await commercialPerformanceService.recalculateAll(periodStart, periodEnd);

      res.json({
        message: 'Commercial performances recalculated successfully',
        count,
      });
    } catch (error) {
      console.error('Error recalculating commercial performances:', error);
      res.status(500).json({ message: 'Error recalculating commercial performances' });
    }
  }
}

export const commercialPerformanceController = new CommercialPerformanceController();
