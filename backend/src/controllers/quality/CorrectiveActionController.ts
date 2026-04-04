import { Request, Response } from 'express';
import { correctiveActionService } from '../../services/quality';
import { CorrectiveActionStatus } from '../../models/quality/CorrectiveAction';

export class CorrectiveActionController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, ncId, assignedTo } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (ncId) filters.ncId = ncId;
      if (assignedTo) filters.assignedTo = assignedTo;
      
      const actions = await correctiveActionService.findAll(filters);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch corrective actions' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const action = await correctiveActionService.findById(id);
      
      if (!action) {
        res.status(404).json({ error: 'Corrective action not found' });
        return;
      }
      
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch corrective action' });
    }
  }

  async getByNC(req: Request, res: Response): Promise<void> {
    try {
      const { ncId } = req.params;
      const actions = await correctiveActionService.findByNC(ncId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch corrective actions' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const action = await correctiveActionService.create(req.body);
      res.status(201).json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create corrective action' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const action = await correctiveActionService.update(id, req.body);
      
      if (!action) {
        res.status(404).json({ error: 'Corrective action not found' });
        return;
      }
      
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update corrective action' });
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { effectivenessVerification } = req.body;
      
      const action = await correctiveActionService.complete(id, effectivenessVerification);
      
      if (!action) {
        res.status(404).json({ error: 'Corrective action not found' });
        return;
      }
      
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete corrective action' });
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { verificationNotes } = req.body;
      
      const action = await correctiveActionService.verify(id, verificationNotes);
      
      if (!action) {
        res.status(404).json({ error: 'Corrective action not found' });
        return;
      }
      
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify corrective action' });
    }
  }

  async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const { days } = req.query;
      const actions = await correctiveActionService.getUpcoming(days ? parseInt(days as string) : 7);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch upcoming corrective actions' });
    }
  }
}

export const correctiveActionController = new CorrectiveActionController();
