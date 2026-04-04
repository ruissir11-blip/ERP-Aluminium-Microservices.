import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { EquipmentROI } from '../../models/comptabilite/EquipmentROI';
import { calculateROI, calculatePayback } from '../../utils/decimal';

export interface ROIInput {
  investmentCost: number;
  annualBenefit: number;
}

export interface ROIResult {
  investmentCost: number;
  annualBenefit: number;
  roiPercent: number;
  paybackYears: number;
}

export class ROIService {
  private roiRepository: Repository<EquipmentROI>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.roiRepository = ds.getRepository(EquipmentROI);
  }

  /**
   * Calculate ROI: (Annual Benefit / Investment Cost) * 100
   */
  calculateROI(investmentCost: number, annualBenefit: number): number {
    const roi = calculateROI(annualBenefit, investmentCost);
    return Number(roi.toFixed(2));
  }

  /**
   * Calculate Payback Period: Investment / Annual Cash Flow
   */
  calculatePaybackPeriod(investmentCost: number, annualBenefit: number): number {
    const payback = calculatePayback(investmentCost, annualBenefit);
    return Number(payback.toFixed(2));
  }

  /**
   * Calculate ROI and payback
   */
  calculate(investmentCost: number, annualBenefit: number): ROIResult {
    return {
      investmentCost,
      annualBenefit,
      roiPercent: this.calculateROI(investmentCost, annualBenefit),
      paybackYears: this.calculatePaybackPeriod(investmentCost, annualBenefit),
    };
  }

  /**
   * Save ROI record for equipment
   */
  async saveROI(
    equipmentId: string,
    investmentCost: number,
    annualBenefit: number
  ): Promise<EquipmentROI> {
    const result = this.calculate(investmentCost, annualBenefit);

    // Check if ROI already exists
    let roi = await this.roiRepository.findOne({
      where: { equipmentId },
    });

    if (roi) {
      roi.investmentCost = result.investmentCost;
      roi.annualBenefit = result.annualBenefit;
      roi.roiPercent = result.roiPercent;
      roi.paybackYears = result.paybackYears;
    } else {
      roi = this.roiRepository.create({
        equipmentId,
        investmentCost: result.investmentCost,
        annualBenefit: result.annualBenefit,
        roiPercent: result.roiPercent,
        paybackYears: result.paybackYears,
      });
    }

    return this.roiRepository.save(roi);
  }

  /**
   * Get ROI by equipment ID
   */
  async getROIByEquipment(equipmentId: string): Promise<EquipmentROI | null> {
    return this.roiRepository.findOne({
      where: { equipmentId },
    });
  }

  /**
   * Get all ROI records
   */
  async getAllROI(): Promise<EquipmentROI[]> {
    return this.roiRepository.find({
      order: { roiPercent: 'DESC' },
    });
  }

  /**
   * Compare multiple ROI scenarios
   */
  compareScenarios(scenarios: ROIInput[]): ROIResult[] {
    return scenarios.map((scenario) => this.calculate(scenario.investmentCost, scenario.annualBenefit));
  }
}
