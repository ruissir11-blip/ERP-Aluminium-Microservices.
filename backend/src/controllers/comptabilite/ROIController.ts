import { Request, Response } from 'express';
import { ROIService } from '../../services/comptabilite/ROIService';

const roiService = new ROIService();

export class ROIController {
  /**
   * GET /api/comptabilite/roi/:equipmentId
   * Get ROI for a specific equipment
   */
  async getByEquipmentId(req: Request, res: Response): Promise<void> {
    try {
      const { equipmentId } = req.params;
      
      // Return placeholder since entity retrieval requires more setup
      res.json({ 
        equipmentId, 
        message: 'ROI calculation endpoint - configure equipment ID' 
      });
    } catch (error) {
      console.error('Error fetching ROI:', error);
      res.status(500).json({ message: 'Error fetching ROI' });
    }
  }

  /**
   * POST /api/comptabilite/roi/calculate
   * Calculate ROI for given parameters
   */
  async calculate(req: Request, res: Response): Promise<void> {
    try {
      const { investment_cost, annual_benefit } = req.body;

      if (!investment_cost || !annual_benefit) {
        res.status(400).json({ error: 'investment_cost and annual_benefit are required' });
        return;
      }

      const result = roiService.calculate(
        parseFloat(investment_cost),
        parseFloat(annual_benefit)
      );

      res.json({
        investmentCost: result.investmentCost,
        annualBenefit: result.annualBenefit,
        roiPercent: result.roiPercent,
        paybackYears: result.paybackYears,
      });
    } catch (error) {
      console.error('Error calculating ROI:', error);
      res.status(500).json({ message: 'Error calculating ROI' });
    }
  }

  /**
   * POST /api/comptabilite/roi/compare
   * Compare multiple ROI scenarios
   */
  async compare(req: Request, res: Response): Promise<void> {
    try {
      const { scenarios } = req.body;

      if (!scenarios || !Array.isArray(scenarios)) {
        res.status(400).json({ error: 'scenarios array is required' });
        return;
      }

      const results = scenarios.map((s: any) => {
        const result = roiService.calculate(
          parseFloat(s.investment_cost),
          parseFloat(s.annual_benefit)
        );
        return {
          scenario: s.name || 'Scenario',
          investmentCost: result.investmentCost,
          annualBenefit: result.annualBenefit,
          roiPercent: result.roiPercent,
          paybackYears: result.paybackYears,
        };
      });

      res.json(results);
    } catch (error) {
      console.error('Error comparing ROIs:', error);
      res.status(500).json({ message: 'Error comparing ROIs' });
    }
  }
}

export const roiController = new ROIController();
