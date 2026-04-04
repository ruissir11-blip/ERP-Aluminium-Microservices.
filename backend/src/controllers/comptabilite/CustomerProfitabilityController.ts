import { Request, Response } from 'express';
import { profitabilityService } from '../../services/comptabilite/ProfitabilityService';

export class CustomerProfitabilityController {
  /**
   * GET /api/comptabilite/customers/profitability
   * Get all customer profitabilities with pagination
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        perPage = '10',
        sortBy = 'marginPercent',
        sortOrder = 'DESC',
        min_margin,
        max_margin,
      } = req.query;

      const result = await profitabilityService.getAllProfitabilities({
        page: parseInt(page as string, 10),
        perPage: parseInt(perPage as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
        minMargin: min_margin ? parseFloat(min_margin as string) : undefined,
        maxMargin: max_margin ? parseFloat(max_margin as string) : undefined,
      });

      res.json({
        data: result.data,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching customer profitabilities:', error);
      res.status(500).json({ message: 'Error fetching customer profitabilities' });
    }
  }

  /**
   * GET /api/comptabilite/customers/:id/profitability
   * Get profitability for a specific customer
   */
  async getByCustomerId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profitability = await profitabilityService.getCustomerProfitabilityById(id);

      if (!profitability) {
        res.status(404).json({ message: 'Customer profitability not found' });
        return;
      }

      res.json(profitability);
    } catch (error) {
      console.error('Error fetching customer profitability:', error);
      res.status(500).json({ message: 'Error fetching customer profitability' });
    }
  }

  /**
   * POST /api/comptabilite/customers/:id/recalculate-profitability
   * Recalculate profitability for a specific customer
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profitability = await profitabilityService.calculateCustomerProfitability(id);

      res.json({
        message: 'Customer profitability recalculated successfully',
        data: profitability,
      });
    } catch (error) {
      console.error('Error recalculating customer profitability:', error);
      res.status(500).json({ message: 'Error recalculating customer profitability' });
    }
  }

  /**
   * POST /api/comptabilite/customers/recalculate-profitability
   * Recalculate all customer profitabilities
   */
  async recalculateAll(req: Request, res: Response): Promise<void> {
    try {
      const count = await profitabilityService.recalculateAll();

      res.json({
        message: 'All customer profitabilities recalculated successfully',
        count,
      });
    } catch (error) {
      console.error('Error recalculating all customer profitabilities:', error);
      res.status(500).json({ message: 'Error recalculating all customer profitabilities' });
    }
  }
}

export const customerProfitabilityController = new CustomerProfitabilityController();
