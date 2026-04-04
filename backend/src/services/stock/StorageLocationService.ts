import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { StorageLocation } from '../../models/stock/StorageLocation';

export interface CreateStorageLocationInput {
  warehouseId: string;
  zone: string;
  rack: string;
  aisle: string;
  level: string;
  code: string;
  maxWeight?: number;
  maxVolume?: number;
}

export interface UpdateStorageLocationInput extends Partial<CreateStorageLocationInput> {
  isActive?: boolean;
}

export class StorageLocationService {
  private locationRepository: Repository<StorageLocation>;

  constructor() {
    this.locationRepository = AppDataSource.getRepository(StorageLocation);
  }

  /**
   * Get all storage locations with optional filtering
   */
  async findAll(warehouseId?: string, isActive?: boolean): Promise<StorageLocation[]> {
    const query = this.locationRepository.createQueryBuilder('location')
      .leftJoinAndSelect('location.warehouse', 'warehouse');

    if (warehouseId) {
      query.andWhere('location.warehouseId = :warehouseId', { warehouseId });
    }

    if (isActive !== undefined) {
      query.andWhere('location.isActive = :isActive', { isActive });
    }

    return query.orderBy('location.code', 'ASC').getMany();
  }

  /**
   * Get storage location by ID
   */
  async findById(id: string): Promise<StorageLocation | null> {
    return this.locationRepository.findOne({
      where: { id },
      relations: ['warehouse'],
    });
  }

  /**
   * Get storage location by code
   */
  async findByCode(code: string): Promise<StorageLocation | null> {
    return this.locationRepository.findOneBy({ code });
  }

  /**
   * Create new storage location
   */
  async create(input: CreateStorageLocationInput): Promise<StorageLocation> {
    // Check for duplicate code
    const existing = await this.findByCode(input.code);
    if (existing) {
      throw new Error(`Storage location with code '${input.code}' already exists`);
    }

    const location = this.locationRepository.create({
      ...input,
      isActive: true,
    });

    return this.locationRepository.save(location);
  }

  /**
   * Update existing storage location
   */
  async update(id: string, input: UpdateStorageLocationInput): Promise<StorageLocation> {
    const location = await this.findById(id);
    if (!location) {
      throw new Error('Storage location not found');
    }

    // Check for duplicate code if changing code
    if (input.code && input.code !== location.code) {
      const existing = await this.findByCode(input.code);
      if (existing) {
        throw new Error(`Storage location with code '${input.code}' already exists`);
      }
    }

    Object.assign(location, input);
    return this.locationRepository.save(location);
  }

  /**
   * Deactivate storage location (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const location = await this.findById(id);
    if (!location) {
      throw new Error('Storage location not found');
    }

    location.isActive = false;
    await this.locationRepository.save(location);
  }

  /**
   * Reactivate storage location
   */
  async reactivate(id: string): Promise<StorageLocation> {
    const location = await this.findById(id);
    if (!location) {
      throw new Error('Storage location not found');
    }

    location.isActive = true;
    return this.locationRepository.save(location);
  }

  /**
   * Get active storage locations for a warehouse
   */
  async findActiveByWarehouse(warehouseId: string): Promise<StorageLocation[]> {
    return this.locationRepository.find({
      where: { warehouseId, isActive: true },
      order: { code: 'ASC' },
    });
  }
}
