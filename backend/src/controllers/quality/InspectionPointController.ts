import { Request, Response } from 'express';
import { inspectionPointService } from '../../services/quality';
import { ProductionStage } from '../../models/quality/InspectionPoint';

export class InspectionPointController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { stage } = req.query;
      const points = stage 
        ? await inspectionPointService.findByStage(stage as ProductionStage)
        : await inspectionPointService.findAll();
      
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspection points' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const point = await inspectionPointService.findById(id);
      
      if (!point) {
        res.status(404).json({ error: 'Inspection point not found' });
        return;
      }
      
      res.json(point);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspection point' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const point = await inspectionPointService.create(req.body);
      res.status(201).json(point);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create inspection point' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const point = await inspectionPointService.update(id, req.body);
      
      if (!point) {
        res.status(404).json({ error: 'Inspection point not found' });
        return;
      }
      
      res.json(point);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update inspection point' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await inspectionPointService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete inspection point' });
    }
  }
}

export const inspectionPointController = new InspectionPointController();
