import { Request, Response } from 'express';
import { CostCalculationService } from '../../services/comptabilite/CostCalculationService';

export class ProductCostController {
  private service: CostCalculationService;

  constructor() {
    this.service = new CostCalculationService();
  }

  /**
   * GET /api/comptabilite/product-costs
   * List all product costs with pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', sort_by = 'totalCost', order = 'ASC' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const sortBy = sort_by as string;
      const orderDir = order === 'DESC' ? 'DESC' : 'ASC';

      const result = await this.service.getAllProductCosts(pageNum, limitNum, sortBy, orderDir);

      res.json({
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
        },
      });
    } catch (error) {
      console.error('Error listing product costs:', error);
      res.status(500).json({ error: 'Failed to list product costs' });
    }
  }

  /**
   * GET /api/comptabilite/product-costs/:profileId
   * Get product cost by profile ID
   */
  async getByProfileId(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;

      const productCost = await this.service.getProductCostByProfileId(profileId);

      if (!productCost) {
        res.status(404).json({ error: 'Product cost not found' });
        return;
      }

      res.json(productCost);
    } catch (error) {
      console.error('Error getting product cost:', error);
      res.status(500).json({ error: 'Failed to get product cost' });
    }
  }

  /**
   * POST /api/comptabilite/costs/recalculate
   * Trigger cost recalculation
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.service.recalculateAllProductCosts();

      res.json({
        message: 'Recalculation complete',
        productsProcessed: count,
      });
    } catch (error) {
      console.error('Error recalculating costs:', error);
      res.status(500).json({ error: 'Failed to recalculate costs' });
    }
  }
}
