import { Request, Response } from 'express';
import { CostComponentRepository } from '../../services/comptabilite/CostComponentRepository';
import { CostComponentType } from '../../models/comptabilite/CostComponent';

export class CostComponentController {
  private repository: CostComponentRepository;

  constructor() {
    this.repository = new CostComponentRepository();
  }

  /**
   * GET /api/comptabilite/cost-components
   * List all cost components with optional filtering
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { type, is_active, page = '1', limit = '20' } = req.query;

      const filters: any = {};
      if (type) {
        filters.type = type as CostComponentType;
      }
      if (is_active !== undefined) {
        filters.isActive = is_active === 'true';
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.repository.findAll(filters, pageNum, limitNum);

      res.json({
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
        },
      });
    } catch (error) {
      console.error('Error listing cost components:', error);
      res.status(500).json({ error: 'Failed to list cost components' });
    }
  }

  /**
   * POST /api/comptabilite/cost-components
   * Create a new cost component
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, rate, unit } = req.body;

      if (!name || !type || rate === undefined || !unit) {
        res.status(400).json({ error: 'Missing required fields: name, type, rate, unit' });
        return;
      }

      const validTypes = Object.values(CostComponentType);
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const component = await this.repository.create({
        name,
        type: type as CostComponentType,
        rate: parseFloat(rate),
        unit,
      });

      res.status(201).json(component);
    } catch (error) {
      console.error('Error creating cost component:', error);
      res.status(500).json({ error: 'Failed to create cost component' });
    }
  }

  /**
   * PUT /api/comptabilite/cost-components/:id
   * Update a cost component
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type, rate, unit, is_active } = req.body;

      const updates: any = {};
      if (name) updates.name = name;
      if (type) {
        const validTypes = Object.values(CostComponentType);
        if (!validTypes.includes(type)) {
          res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
          return;
        }
        updates.type = type as CostComponentType;
      }
      if (rate !== undefined) updates.rate = parseFloat(rate);
      if (unit) updates.unit = unit;
      if (is_active !== undefined) updates.isActive = is_active === true || is_active === 'true';

      const component = await this.repository.update(id, updates);

      if (!component) {
        res.status(404).json({ error: 'Cost component not found' });
        return;
      }

      res.json(component);
    } catch (error) {
      console.error('Error updating cost component:', error);
      res.status(500).json({ error: 'Failed to update cost component' });
    }
  }

  /**
   * DELETE /api/comptabilite/cost-components/:id
   * Soft delete a cost component
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const success = await this.repository.softDelete(id);

      if (!success) {
        res.status(404).json({ error: 'Cost component not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting cost component:', error);
      res.status(500).json({ error: 'Failed to delete cost component' });
    }
  }
}
