import { Request, Response } from 'express';
import { ncRootCauseService } from '../../services/quality';
import { RootCauseMethod, RootCauseCategory } from '../../models/quality/NCRootCause';

export class NCRootCauseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { method, category, ncId } = req.query;
      
      const filters: any = {};
      if (method) filters.method = method;
      if (category) filters.category = category;
      if (ncId) filters.ncId = ncId;
      
      const rootCauses = await ncRootCauseService.findAll(filters);
      res.json(rootCauses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch root causes' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rootCause = await ncRootCauseService.findById(id);
      
      if (!rootCause) {
        res.status(404).json({ error: 'Root cause not found' });
        return;
      }
      
      res.json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch root cause' });
    }
  }

  async getByNC(req: Request, res: Response): Promise<void> {
    try {
      const { ncId } = req.params;
      const rootCause = await ncRootCauseService.findByNC(ncId);
      res.json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch root cause' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const rootCause = await ncRootCauseService.create(req.body);
      res.status(201).json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create root cause' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rootCause = await ncRootCauseService.update(id, req.body);
      
      if (!rootCause) {
        res.status(404).json({ error: 'Root cause not found' });
        return;
      }
      
      res.json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update root cause' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ncRootCauseService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete root cause' });
    }
  }

  async addCinqPourquoi(req: Request, res: Response): Promise<void> {
    try {
      const { ncId } = req.params;
      const { pourquoiResponses } = req.body;
      
      const rootCause = await ncRootCauseService.addCinqPourquoi(ncId, pourquoiResponses);
      
      if (!rootCause) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add 5 Pourquoi analysis' });
    }
  }

  async addIshikawa(req: Request, res: Response): Promise<void> {
    try {
      const { ncId } = req.params;
      const ishikawaData = req.body;
      
      const rootCause = await ncRootCauseService.addIshikawa(ncId, ishikawaData);
      
      if (!rootCause) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(rootCause);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add Ishikawa analysis' });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }
      
      const stats = await ncRootCauseService.getStatistics(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

export const ncRootCauseController = new NCRootCauseController();
