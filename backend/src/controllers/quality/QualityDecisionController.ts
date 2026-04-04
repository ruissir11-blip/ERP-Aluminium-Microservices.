import { Request, Response } from 'express';
import { qualityDecisionService } from '../../services/quality';
import { DecisionStatus } from '../../models/quality/QualityDecision';

export class QualityDecisionController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, decisionType, ncId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (decisionType) filters.decisionType = decisionType;
      if (ncId) filters.ncId = ncId;
      
      const decisions = await qualityDecisionService.findAll(filters);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quality decisions' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const decision = await qualityDecisionService.findById(id);
      
      if (!decision) {
        res.status(404).json({ error: 'Quality decision not found' });
        return;
      }
      
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quality decision' });
    }
  }

  async getByNC(req: Request, res: Response): Promise<void> {
    try {
      const { ncId } = req.params;
      const decisions = await qualityDecisionService.findByNC(ncId);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quality decisions' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const decision = await qualityDecisionService.create(req.body);
      res.status(201).json(decision);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create quality decision' });
    }
  }

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approvedBy, notes } = req.body;
      
      const decision = await qualityDecisionService.approve(id, approvedBy, notes);
      
      if (!decision) {
        res.status(404).json({ error: 'Quality decision not found' });
        return;
      }
      
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve quality decision' });
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectedBy, notes } = req.body;
      
      const decision = await qualityDecisionService.reject(id, rejectedBy, notes);
      
      if (!decision) {
        res.status(404).json({ error: 'Quality decision not found' });
        return;
      }
      
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject quality decision' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const decision = await qualityDecisionService.update(id, req.body);
      
      if (!decision) {
        res.status(404).json({ error: 'Quality decision not found' });
        return;
      }
      
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update quality decision' });
    }
  }

  async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const decisions = await qualityDecisionService.getPendingApprovals();
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }
      
      const stats = await qualityDecisionService.getStatistics(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

export const qualityDecisionController = new QualityDecisionController();
