import { Request, Response } from 'express';
import { nonConformityService } from '../../services/quality';
import { NCStatus, NCSeverity } from '../../models/quality/NonConformity';

export class NonConformityController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, severity, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
      
      const ncRecords = await nonConformityService.findAll(filters);
      res.json(ncRecords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-conformities' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const nc = await nonConformityService.findById(id);
      
      if (!nc) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(nc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-conformity' });
    }
  }

  async getByNCNumber(req: Request, res: Response): Promise<void> {
    try {
      const { ncNumber } = req.params;
      const nc = await nonConformityService.findByNCNumber(ncNumber);
      
      if (!nc) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(nc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-conformity' });
    }
  }

  async getByLot(req: Request, res: Response): Promise<void> {
    try {
      const { lotNumber } = req.params;
      const ncRecords = await nonConformityService.findByLot(lotNumber);
      res.json(ncRecords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-conformities' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const nc = await nonConformityService.create(req.body);
      res.status(201).json(nc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create non-conformity' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const nc = await nonConformityService.update(id, req.body);
      
      if (!nc) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(nc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update non-conformity' });
    }
  }

  async close(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      
      const nc = await nonConformityService.close(id, resolutionNotes);
      
      if (!nc) {
        res.status(404).json({ error: 'Non-conformity not found' });
        return;
      }
      
      res.json(nc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to close non-conformity' });
    }
  }

  async getOpenByPriority(req: Request, res: Response): Promise<void> {
    try {
      const ncRecords = await nonConformityService.getOpenNCsByPriority();
      res.json(ncRecords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch open non-conformities' });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }
      
      const stats = await nonConformityService.getStatistics(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

export const nonConformityController = new NonConformityController();
