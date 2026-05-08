import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { ProductCost } from '../../models/comptabilite/ProductCost';
import { AluminumProfile } from '../../models/aluminium/AluminumProfile';
import {
  add,
  multiply,
  toDecimal,
  round,
} from '../../utils/decimal';

export interface CalculateProductCostInput {
  profileId: string;
  materialQuantity: number;
  laborHours: number;
  overheadAllocationMethod?: 'labor_hours' | 'machine_hours' | 'material_cost';
}

export interface ProductCostResult {
  profileId: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
}

export class CostCalculationService {
  private productCostRepository: Repository<ProductCost>;
  private profileRepository: Repository<AluminumProfile>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.productCostRepository = ds.getRepository(ProductCost);
    this.profileRepository = ds.getRepository(AluminumProfile);
  }

  /**
   * Calculate product cost based on default rates (since cost components removed)
   */
  async calculateProductCost(input: CalculateProductCostInput): Promise<ProductCostResult> {
    const { profileId, materialQuantity, laborHours, overheadAllocationMethod = 'labor_hours' } = input;

    // Default rates (these would typically come from configuration)
    const DEFAULT_MATERIAL_RATE = 10.0; // DT per unit
    const DEFAULT_LABOR_RATE = 50.0; // DT per hour
    const DEFAULT_OVERHEAD_RATE = 20.0; // DT per hour or % of material cost

    // Calculate material cost
    let materialCost = 0;
    materialCost = Number(
      multiply(materialQuantity, DEFAULT_MATERIAL_RATE).toFixed(2)
    );

    // Calculate labor cost
    let laborCost = 0;
    laborCost = Number(
      multiply(laborHours, DEFAULT_LABOR_RATE).toFixed(2)
    );

    // Calculate overhead cost
    let overheadCost = 0;
    switch (overheadAllocationMethod) {
      case 'labor_hours':
        overheadCost = Number(
          multiply(laborHours, DEFAULT_OVERHEAD_RATE).toFixed(2)
        );
        break;
      case 'material_cost':
        overheadCost = Number(
          multiply(materialCost, DEFAULT_OVERHEAD_RATE / 100).toFixed(2) // Assuming percentage
        );
        break;
      case 'machine_hours':
        // For now, use labor hours as proxy for machine hours
        overheadCost = Number(
          multiply(laborHours, DEFAULT_OVERHEAD_RATE).toFixed(2)
        );
        break;
    }

    // Calculate total cost
    const totalCost = Number(
      add(add(materialCost, laborCost), overheadCost).toFixed(2)
    );

    return {
      profileId,
      materialCost,
      laborCost,
      overheadCost,
      totalCost,
    };
  }

  /**
   * Save or update product cost
   */
  async saveProductCost(profileId: string, costResult: ProductCostResult): Promise<ProductCost> {
    // Check if product cost already exists
    let productCost = await this.productCostRepository.findOne({
      where: { profileId },
    });

    if (productCost) {
      // Update existing
      productCost.materialCost = costResult.materialCost;
      productCost.laborCost = costResult.laborCost;
      productCost.overheadCost = costResult.overheadCost;
      productCost.totalCost = costResult.totalCost;
    } else {
      // Create new
      productCost = this.productCostRepository.create({
        profileId,
        materialCost: costResult.materialCost,
        laborCost: costResult.laborCost,
        overheadCost: costResult.overheadCost,
        totalCost: costResult.totalCost,
      });
    }

    return this.productCostRepository.save(productCost);
  }

  /**
   * Recalculate all product costs
   */
  async recalculateAllProductCosts(): Promise<number> {
    const profiles = await this.profileRepository.find();
    let count = 0;

    for (const profile of profiles) {
      try {
        // Default values - in real implementation, these would come from
        // the profile's routing or BOM data
        const costResult = await this.calculateProductCost({
          profileId: profile.id,
          materialQuantity: 1, // Default 1 unit
          laborHours: 0.1, // Default minimal labor
        });

        await this.saveProductCost(profile.id, costResult);
        count++;
      } catch (error) {
        console.error(`Failed to calculate cost for profile ${profile.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Get product cost by profile ID
   */
  async getProductCostByProfileId(profileId: string): Promise<ProductCost | null> {
    return this.productCostRepository.findOne({
      where: { profileId },
    });
  }

  /**
   * Get all product costs with pagination
   */
  async getAllProductCosts(
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'totalCost',
    order: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ data: ProductCost[]; total: number }> {
    const validSortFields = ['totalCost', 'materialCost', 'laborCost', 'overheadCost'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalCost';

    const [data, total] = await this.productCostRepository.findAndCount({
      relations: ['profile'],
      order: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }
}
