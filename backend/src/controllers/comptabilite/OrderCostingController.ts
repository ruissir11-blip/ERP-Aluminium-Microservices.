import { Request, Response } from 'express';
import { orderCostingService } from '../../services/comptabilite/OrderCostingService';

export class OrderCostingController {
  /**
   * GET /api/comptabilite/orders
   * Get all order costings with pagination
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        perPage = '10',
        sortBy = 'calculatedAt',
        sortOrder = 'DESC',
        min_margin,
        start_date,
        end_date,
      } = req.query;

      const result = await orderCostingService.getAllOrderCostings({
        page: parseInt(page as string, 10),
        perPage: parseInt(perPage as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
        minMargin: min_margin ? parseFloat(min_margin as string) : undefined,
        startDate: start_date as string,
        endDate: end_date as string,
      });

      res.json({
        data: result.data,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching order costings:', error);
      res.status(500).json({ message: 'Error fetching order costings' });
    }
  }

  /**
   * GET /api/comptabilite/orders/:id/costing
   * Get costing for a specific order
   */
  async getByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const costing = await orderCostingService.getOrderCostingByOrderId(id);

      if (!costing) {
        res.status(404).json({ message: 'Order costing not found' });
        return;
      }

      res.json(costing);
    } catch (error) {
      console.error('Error fetching order costing:', error);
      res.status(500).json({ message: 'Error fetching order costing' });
    }
  }

  /**
   * POST /api/comptabilite/orders/:id/recalculate-costing
   * Recalculate costing for a specific order
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const costing = await orderCostingService.calculateOrderCosting(id);

      res.json({
        message: 'Order costing recalculated successfully',
        data: costing,
      });
    } catch (error) {
      console.error('Error recalculating order costing:', error);
      res.status(500).json({ message: 'Error recalculating order costing' });
    }
  }

  /**
   * POST /api/comptabilite/orders/recalculate-all
   * Recalculate all order costings
   */
  async recalculateAll(req: Request, res: Response): Promise<void> {
    try {
      const count = await orderCostingService.recalculateAll();

      res.json({
        message: 'All order costings recalculated successfully',
        count,
      });
    } catch (error) {
      console.error('Error recalculating all order costings:', error);
      res.status(500).json({ message: 'Error recalculating all order costings' });
    }
  }
}

export const orderCostingController = new OrderCostingController();
