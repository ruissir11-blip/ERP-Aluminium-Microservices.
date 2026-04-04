import { Request, Response } from 'express';
import { KPIService } from '../../services/comptabilite/KPIService';
import { kpiCache } from '../../config/kpi-cache';

const kpiService = new KPIService();

export class KPIController {
  /**
   * GET /api/comptabilite/kpis/dso
   * Get Days Sales Outstanding
   */
  async getDSO(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'kpi:dso';
      const cached = await kpiCache.getKPI<number>(cacheKey);
      
      if (cached !== null) {
        res.json({ currentDso: cached, trend: 'stable' });
        return;
      }

      const dso = await kpiService.calculateDSO();

      await kpiCache.setKPI(cacheKey, dso, 1800);
      res.json({ currentDso: dso, trend: 'stable' });
    } catch (error) {
      console.error('Error calculating DSO:', error);
      res.status(500).json({ message: 'Error calculating DSO' });
    }
  }

  /**
   * GET /api/comptabilite/kpis/aging
   * Get receivable aging
   */
  async getAging(req: Request, res: Response): Promise<void> {
    try {
      const aging = await kpiService.calculateReceivableAging();
      res.json(aging);
    } catch (error) {
      console.error('Error calculating aging:', error);
      res.status(500).json({ message: 'Error calculating aging' });
    }
  }

  /**
   * GET /api/comptabilite/kpis/dashboard
   * Get dashboard KPIs
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'dashboard:kpis';
      const cached = await kpiCache.getDashboard<any>(cacheKey);
      
      if (cached) {
        res.json(cached);
        return;
      }

      const dashboard = await kpiService.getDashboardKPIs();

      await kpiCache.setDashboard(cacheKey, dashboard, 300);
      res.json(dashboard);
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      res.status(500).json({ message: 'Error fetching dashboard KPIs' });
    }
  }

  /**
   * POST /api/comptabilite/kpis/recalculate
   * Recalculate all KPIs
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      await kpiService.calculateDSO();
      await kpiService.calculateReceivableAging();
      await kpiCache.invalidateKPIs();
      await kpiCache.invalidateDashboards();

      res.json({ message: 'KPIs recalculated successfully' });
    } catch (error) {
      console.error('Error recalculating KPIs:', error);
      res.status(500).json({ message: 'Error recalculating KPIs' });
    }
  }
}

export const kpiController = new KPIController();
