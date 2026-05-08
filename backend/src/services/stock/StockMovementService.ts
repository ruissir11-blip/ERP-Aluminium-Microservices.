import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { StockMovement, MovementType } from '../../models/stock/StockMovement';
import { InventoryItem } from '../../models/stock/InventoryItem';

export interface StockMovementFilters {
  profileId?: string;
  warehouseId?: string;
  locationId?: string;
  movementType?: MovementType;
  startDate?: Date;
  endDate?: Date;
  referenceType?: string;
  referenceId?: string;
}

export class StockMovementService {
  private movementRepository: Repository<StockMovement>;
  private itemRepository: Repository<InventoryItem>;
  private dataSource: DataSource;

  constructor() {
    this.movementRepository = AppDataSource.getRepository(StockMovement);
    this.itemRepository = AppDataSource.getRepository(InventoryItem);
    this.dataSource = AppDataSource;
  }

  /**
   * Get all stock movements with optional filtering
   */
  async findAll(filters: StockMovementFilters = {}, page: number = 1, limit: number = 20): Promise<{ data: StockMovement[]; total: number }> {
    const query = this.movementRepository.createQueryBuilder('movement')
      .leftJoinAndSelect('movement.profile', 'profile')
      .leftJoinAndSelect('movement.warehouse', 'warehouse')
      .leftJoinAndSelect('movement.location', 'location')
      .leftJoinAndSelect('movement.lot', 'lot');

    if (filters.profileId) {
      query.andWhere('movement.profileId = :profileId', { profileId: filters.profileId });
    }

    if (filters.warehouseId) {
      query.andWhere('movement.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    }

    if (filters.locationId) {
      query.andWhere('movement.locationId = :locationId', { locationId: filters.locationId });
    }

    if (filters.movementType) {
      query.andWhere('movement.movementType = :movementType', { movementType: filters.movementType });
    }

    if (filters.startDate) {
      query.andWhere('movement.performedAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('movement.performedAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.referenceType) {
      query.andWhere('movement.referenceType = :referenceType', { referenceType: filters.referenceType });
    }

    if (filters.referenceId) {
      query.andWhere('movement.referenceId = :referenceId', { referenceId: filters.referenceId });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('movement.performedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * Get stock movement by ID
   */
  async findById(id: string): Promise<StockMovement | null> {
    return this.movementRepository.findOne({
      where: { id },
      relations: ['profile', 'warehouse', 'location', 'lot'],
    });
  }

  /**
   * Get movements by reference
   */
  async findByReference(referenceType: string, referenceId: string): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { referenceType, referenceId },
      relations: ['profile', 'warehouse', 'location', 'lot'],
      order: { performedAt: 'DESC' },
    });
  }

  /**
   * Calculate stock rotation rate
   * Rotation = Total Issues / Average Stock
   */
  async calculateRotationRate(profileId: string, warehouseId?: string, days: number = 90): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total issues
    const issuesQuery = this.movementRepository.createQueryBuilder('movement')
      .select('SUM(movement.quantity)', 'totalIssues')
      .where('movement.profileId = :profileId', { profileId })
      .andWhere('movement.movementType = :type', { type: MovementType.ISSUE })
      .andWhere('movement.performedAt >= :startDate', { startDate });

    if (warehouseId) {
      issuesQuery.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    }

    const issuesResult = await issuesQuery.getRawOne();
    const totalIssues = Number(issuesResult?.totalIssues || 0);

    // Get average stock
    const avgStockQuery = this.movementRepository.createQueryBuilder('movement')
      .select('AVG(movement.newQuantity)', 'avgStock')
      .where('movement.profileId = :profileId', { profileId })
      .andWhere('movement.performedAt >= :startDate', { startDate });

    if (warehouseId) {
      avgStockQuery.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    }

    const avgStockResult = await avgStockQuery.getRawOne();
    const avgStock = Number(avgStockResult?.avgStock || 0);

    if (avgStock === 0) return 0;

    return totalIssues / avgStock;
  }

  /**
   * Get movement history for a specific item
   */
  async getHistory(profileId: string, warehouseId: string, limit: number = 50): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { profileId, warehouseId },
      relations: ['profile', 'warehouse', 'location', 'lot'],
      order: { performedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get total movements by type for a period
   */
  async getMovementSummary(profileId: string, warehouseId: string, startDate: Date, endDate: Date): Promise<{
    receipts: number;
    issues: number;
    adjustments: number;
    transfers: number;
  }> {
    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .select('movement.movementType', 'type')
      .addSelect('SUM(movement.quantity)', 'total')
      .where('movement.profileId = :profileId', { profileId })
      .andWhere('movement.warehouseId = :warehouseId', { warehouseId })
      .andWhere('movement.performedAt >= :startDate', { startDate })
      .andWhere('movement.performedAt <= :endDate', { endDate })
      .groupBy('movement.movementType')
      .getRawMany();

    const summary = {
      receipts: 0,
      issues: 0,
      adjustments: 0,
      transfers: 0,
    };

    movements.forEach((m) => {
      switch (m.type) {
        case MovementType.RECEIPT:
          summary.receipts = Number(m.total);
          break;
        case MovementType.ISSUE:
          summary.issues = Number(m.total);
          break;
        case MovementType.ADJUSTMENT:
          summary.adjustments = Number(m.total);
          break;
        case MovementType.TRANSFER:
          summary.transfers = Number(m.total);
          break;
      }
    });

    return summary;
  }

  /**
   * Create a new stock movement and update inventory
   */
  async create(data: {
    profileId: string;
    warehouseId: string;
    locationId?: string;
    lotId?: string;
    movementType: MovementType;
    quantity: number;
    unitCost?: number;
    referenceType: string;
    referenceId: string;
    notes?: string;
    performedBy: string;
    performedAt: Date;
    ipAddress?: string;
  }): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      const movementRepository = manager.getRepository(StockMovement);
      const itemRepository = manager.getRepository(InventoryItem);

      // Find inventory item - explicitly use locationId and lotId to match the unique index
      const where: any = {
        profileId: data.profileId,
        warehouseId: data.warehouseId,
      };
      
      // If locationId/lotId are specified, use them. Otherwise, we assume we're looking for the 'general' stock (null location/lot)
      // Note: This logic might need adjustment if products are always in a location
      where.locationId = data.locationId || null;
      where.lotId = data.lotId || null;

      let item = await itemRepository.findOne({ where });

      const previousQuantity = item ? Number(item.quantityOnHand) : 0;
      let newQuantity = previousQuantity;

      // Update quantity based on movement type
      if (item) {
        switch (data.movementType) {
          case MovementType.RECEIPT:
          case MovementType.COUNT:
            newQuantity = previousQuantity + data.quantity;
            item.quantityOnHand = newQuantity;
            break;
          case MovementType.ISSUE:
            if (previousQuantity < data.quantity) {
              throw new Error(`Insufficient quantity. Available: ${previousQuantity}, Requested: ${data.quantity}`);
            }
            newQuantity = previousQuantity - data.quantity;
            item.quantityOnHand = newQuantity;
            break;
          case MovementType.ADJUSTMENT:
            newQuantity = data.quantity;
            item.quantityOnHand = newQuantity;
            break;
          case MovementType.TRANSFER:
            // For transfers, quantity is the amount being transferred
            if (previousQuantity < data.quantity) {
              throw new Error(`Insufficient quantity for transfer. Available: ${previousQuantity}, Requested: ${data.quantity}`);
            }
            newQuantity = previousQuantity - data.quantity;
            item.quantityOnHand = newQuantity;
            break;
        }
        item.lastMovementDate = data.performedAt;
        await itemRepository.save(item);
      } else if (data.movementType === MovementType.RECEIPT || data.movementType === MovementType.COUNT) {
        // Create new inventory item for receipts
        item = itemRepository.create({
          profileId: data.profileId,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          lotId: data.lotId,
          quantityOnHand: data.quantity,
          quantityReserved: 0,
          averageUnitCost: data.unitCost,
        });
        newQuantity = data.quantity;
        await itemRepository.save(item);
      } else {
        throw new Error('Inventory item not found. For receipts, a new item will be created automatically.');
      }

      // Create movement record
      const movement = movementRepository.create({
        profileId: data.profileId,
        warehouseId: data.warehouseId,
        locationId: data.locationId,
        lotId: data.lotId,
        movementType: data.movementType,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.unitCost ? data.quantity * data.unitCost : undefined,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        performedBy: data.performedBy,
        performedAt: data.performedAt,
        previousQuantity,
        newQuantity,
        ipAddress: data.ipAddress,
      });

      return movementRepository.save(movement);
    });
  }
}
