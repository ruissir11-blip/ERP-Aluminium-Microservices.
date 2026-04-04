import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Warehouse } from '../../models/stock/Warehouse';

export interface CreateWarehouseInput {
  code: string;
  name: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateWarehouseInput extends Partial<CreateWarehouseInput> {
  isActive?: boolean;
}

export class WarehouseService {
  private warehouseRepository: Repository<Warehouse>;

  constructor() {
    this.warehouseRepository = AppDataSource.getRepository(Warehouse);
  }

  /**
   * Get all warehouses with optional filtering
   */
  async findAll(isActive?: boolean): Promise<Warehouse[]> {
    const query = this.warehouseRepository.createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.locations', 'locations')
      .leftJoinAndSelect('warehouse.inventoryItems', 'items');

    if (isActive !== undefined) {
      query.andWhere('warehouse.isActive = :isActive', { isActive });
    }

    return query.orderBy('warehouse.name', 'ASC').getMany();
  }

  /**
   * Get warehouse by ID
   */
  async findById(id: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({
      where: { id },
      relations: ['locations', 'inventoryItems'],
    });
  }

  /**
   * Get warehouse by code
   */
  async findByCode(code: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findOneBy({ code });
  }

  /**
   * Create new warehouse
   */
  async create(input: CreateWarehouseInput): Promise<Warehouse> {
    // Check for duplicate code
    const existing = await this.findByCode(input.code);
    if (existing) {
      throw new Error(`Warehouse with code '${input.code}' already exists`);
    }

    const warehouse = this.warehouseRepository.create({
      ...input,
      isActive: true,
    });

    return this.warehouseRepository.save(warehouse);
  }

  /**
   * Update existing warehouse
   */
  async update(id: string, input: UpdateWarehouseInput): Promise<Warehouse> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check for duplicate code if changing code
    if (input.code && input.code !== warehouse.code) {
      const existing = await this.findByCode(input.code);
      if (existing) {
        throw new Error(`Warehouse with code '${input.code}' already exists`);
      }
    }

    Object.assign(warehouse, input);
    return this.warehouseRepository.save(warehouse);
  }

  /**
   * Deactivate warehouse (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    warehouse.isActive = false;
    await this.warehouseRepository.save(warehouse);
  }

  /**
   * Reactivate warehouse
   */
  async reactivate(id: string): Promise<Warehouse> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    warehouse.isActive = true;
    return this.warehouseRepository.save(warehouse);
  }

  /**
   * Get active warehouses only
   */
  async findActive(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get warehouse statistics
   */
  async getStatistics(id: string): Promise<{
    totalLocations: number;
    totalItems: number;
    totalValue: number;
  }> {
    const warehouse = await this.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const locations = await AppDataSource.getRepository(Warehouse)
      .createQueryBuilder('w')
      .leftJoin('w.locations', 'locations')
      .where('w.id = :id', { id })
      .getMany();

    const items = await AppDataSource.getRepository(Warehouse)
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.inventoryItems', 'items')
      .where('w.id = :id', { id })
      .getMany();

    const totalValue = items.reduce((sum, w) => {
      return sum + w.inventoryItems.reduce((itemSum, item) => {
        return itemSum + (Number(item.quantityOnHand) * Number(item.averageUnitCost || 0));
      }, 0);
    }, 0);

    return {
      totalLocations: warehouse.locations?.length || 0,
      totalItems: warehouse.inventoryItems?.length || 0,
      totalValue,
    };
  }
}
