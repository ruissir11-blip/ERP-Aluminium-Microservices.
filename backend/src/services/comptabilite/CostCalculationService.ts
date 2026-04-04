import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { CostComponent, CostComponentType } from '../../models/comptabilite/CostComponent';
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
  private costComponentRepository: Repository<CostComponent>;
  private productCostRepository: Repository<ProductCost>;
  private profileRepository: Repository<AluminumProfile>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.costComponentRepository = ds.getRepository(CostComponent);
    this.productCostRepository = ds.getRepository(ProductCost);
    this.profileRepository = ds.getRepository(AluminumProfile);
  }

  /**
   * Calculate product cost based on cost components
   */
  async calculateProductCost(input: CalculateProductCostInput): Promise<ProductCostResult> {
    const { profileId, materialQuantity, laborHours, overheadAllocationMethod = 'labor_hours' } = input;

    // Get active cost components
    const costComponents = await this.costComponentRepository.find({
      where: { isActive: true },
    });

    const materialComponent = costComponents.find(
      (c) => c.type === CostComponentType.MATERIAL
    );
    const laborComponent = costComponents.find(
      (c) => c.type === CostComponentType.LABOR
    );
    const overheadComponent = costComponents.find(
      (c) => c.type === CostComponentType.OVERHEAD
    );

    // Calculate material cost
    let materialCost = 0;
    if (materialComponent) {
      materialCost = Number(
        multiply(materialQuantity, materialComponent.rate).toFixed(2)
      );
    }

    // Calculate labor cost
    let laborCost = 0;
    if (laborComponent) {
      laborCost = Number(
        multiply(laborHours, laborComponent.rate).toFixed(2)
      );
    }

    // Calculate overhead cost using ABC method
    let overheadCost = 0;
    if (overheadComponent) {
      switch (overheadAllocationMethod) {
        case 'labor_hours':
          overheadCost = Number(
            multiply(laborHours, overheadComponent.rate).toFixed(2)
          );
          break;
        case 'material_cost':
          overheadCost = Number(
            multiply(materialCost, overheadComponent.rate).toFixed(2)
          );
          break;
        case 'machine_hours':
          // For now, use labor hours as proxy for machine hours
          overheadCost = Number(
            multiply(laborHours, overheadComponent.rate).toFixed(2)
          );
          break;
      }
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
