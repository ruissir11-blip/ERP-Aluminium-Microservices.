import { Request, Response } from 'express';
import { inspectionRecordService } from '../../services/quality';
import { InspectionStatus, InspectionResult } from '../../models/quality/InspectionRecord';

export class InspectionRecordController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, result, inspectorId, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (result) filters.result = result;
      if (inspectorId) filters.inspectorId = inspectorId;
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
      
      const records = await inspectionRecordService.findAll(filters);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspection records' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const record = await inspectionRecordService.findById(id);
      
      if (!record) {
        res.status(404).json({ error: 'Inspection record not found' });
        return;
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspection record' });
    }
  }

  async getByProductionOrder(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId } = req.params;
      const records = await inspectionRecordService.findByProductionOrder(productionOrderId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspection records' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const record = await inspectionRecordService.create(req.body);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create inspection record' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const record = await inspectionRecordService.update(id, req.body);
      
      if (!record) {
        res.status(404).json({ error: 'Inspection record not found' });
        return;
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update inspection record' });
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { measuredValues, inspectorId } = req.body;
      
      const record = await inspectionRecordService.completeInspection(id, measuredValues, inspectorId);
      
      if (!record) {
        res.status(404).json({ error: 'Inspection record not found' });
        return;
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete inspection' });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }
      
      const stats = await inspectionRecordService.getStatistics(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}

export const inspectionRecordController = new InspectionRecordController();
