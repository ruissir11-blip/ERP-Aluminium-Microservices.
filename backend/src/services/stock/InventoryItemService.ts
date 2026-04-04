import { Repository, DataSource, EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { InventoryItem } from '../../models/stock/InventoryItem';
import { StockMovement, MovementType } from '../../models/stock/StockMovement';
import { AluminumProfile } from '../../models/aluminium/AluminumProfile';

export interface CreateInventoryItemInput {
  profileId: string;
  warehouseId: string;
  locationId?: string;
  lotId?: string;
  quantityOnHand?: number;
  averageUnitCost?: number;
}

export interface UpdateInventoryItemInput {
  quantityOnHand?: number;
  quantityReserved?: number;
  averageUnitCost?: number;
}

export interface InventoryItemFilters {
  warehouseId?: string;
  locationId?: string;
  profileId?: string;
  lotId?: string;
  lowStock?: boolean;
  threshold?: number;
}

export interface PaginatedInventoryResult {
  data: InventoryItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class InventoryItemService {
  private itemRepository: Repository<InventoryItem>;
  private movementRepository: Repository<StockMovement>;
  private dataSource: DataSource;

  constructor() {
    this.itemRepository = AppDataSource.getRepository(InventoryItem);
    this.movementRepository = AppDataSource.getRepository(StockMovement);
    this.dataSource = AppDataSource;
  }

  /**
   * Get all inventory items with optional filtering and pagination
   */
  async findAll(
    filters: InventoryItemFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedInventoryResult> {
    const query = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.profile', 'profile')
      .leftJoinAndSelect('item.warehouse', 'warehouse')
      .leftJoinAndSelect('item.location', 'location')
      .leftJoinAndSelect('item.lot', 'lot');

    if (filters.warehouseId) {
      query.andWhere('item.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    }

    if (filters.locationId) {
      query.andWhere('item.locationId = :locationId', { locationId: filters.locationId });
    }

    if (filters.profileId) {
      query.andWhere('item.profileId = :profileId', { profileId: filters.profileId });
    }

    if (filters.lotId) {
      query.andWhere('item.lotId = :lotId', { lotId: filters.lotId });
    }

    if (filters.lowStock && filters.threshold) {
      query.andWhere('item.quantityOnHand <= :threshold', { threshold: filters.threshold });
    }

    const skip = (page - 1) * perPage;
    const [items, total] = await query
      .orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    const totalPages = Math.ceil(total / perPage);

    return {
      data: items,
      total,
      page,
      perPage,
      totalPages,
    };
  }

  /**
   * Get inventory item by ID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    return this.itemRepository.findOne({
      where: { id },
      relations: ['profile', 'warehouse', 'location', 'lot'],
    });
  }

  /**
   * Find inventory item by profile and warehouse
   */
  async findByProfileAndWarehouse(profileId: string, warehouseId: string, locationId?: string): Promise<InventoryItem | null> {
    const query = this.itemRepository.createQueryBuilder('item')
      .where('item.profileId = :profileId', { profileId })
      .andWhere('item.warehouseId = :warehouseId', { warehouseId });

    if (locationId) {
      query.andWhere('item.locationId = :locationId', { locationId });
    } else {
      query.andWhere('item.locationId IS NULL');
    }

    return query.getOne();
  }

  /**
   * Create new inventory item
   */
  async create(input: CreateInventoryItemInput, userId: string, ipAddress?: string): Promise<InventoryItem> {
    // Check if item already exists
    const existing = await this.findByProfileAndWarehouse(
      input.profileId,
      input.warehouseId,
      input.locationId
    );

    if (existing) {
      throw new Error('Inventory item already exists for this profile and warehouse');
    }

    const item = this.itemRepository.create({
      ...input,
      quantityOnHand: input.quantityOnHand || 0,
      quantityReserved: 0,
    });

    const savedItem = await this.itemRepository.save(item);

    // Record initial movement
    await this.recordMovement({
      profileId: input.profileId,
      warehouseId: input.warehouseId,
      locationId: input.locationId,
      lotId: input.lotId,
      movementType: MovementType.RECEIPT,
      quantity: input.quantityOnHand || 0,
      unitCost: input.averageUnitCost,
      referenceType: 'INITIAL',
      referenceId: savedItem.id,
      performedBy: userId,
      performedAt: new Date(),
      previousQuantity: 0,
      newQuantity: input.quantityOnHand || 0,
      ipAddress,
    });

    return savedItem;
  }

  /**
   * Update existing inventory item
   */
  async update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    Object.assign(item, input);
    return this.itemRepository.save(item);
  }

  /**
   * Adjust inventory quantity
   */
  async adjustQuantity(
    id: string,
    adjustment: number,
    reason: string,
    userId: string,
    referenceType: string,
    referenceId: string,
    ipAddress?: string
  ): Promise<InventoryItem> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const previousQuantity = Number(item.quantityOnHand);
    const newQuantity = previousQuantity + adjustment;

    if (newQuantity < 0) {
      throw new Error('Insufficient quantity for adjustment');
    }

    item.quantityOnHand = newQuantity;
    item.lastMovementDate = new Date();

    const savedItem = await this.itemRepository.save(item);

    // Record movement
    await this.recordMovement({
      profileId: item.profileId,
      warehouseId: item.warehouseId,
      locationId: item.locationId,
      lotId: item.lotId,
      movementType: MovementType.ADJUSTMENT,
      quantity: Math.abs(adjustment),
      referenceType,
      referenceId,
      notes: reason,
      performedBy: userId,
      performedAt: new Date(),
      previousQuantity,
      newQuantity,
      ipAddress,
    });

    return savedItem;
  }

  /**
   * Transfer inventory between warehouses
   * Uses database transaction to ensure data consistency
   */
  async transfer(
    itemId: string,
    toWarehouseId: string,
    toLocationId: string | undefined,
    quantity: number,
    userId: string,
    referenceType: string,
    referenceId: string,
    ipAddress?: string
  ): Promise<{ fromItem: InventoryItem; toItem: InventoryItem }> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const itemRepository = manager.getRepository(InventoryItem);
      const movementRepository = manager.getRepository(StockMovement);

      const fromItem = await itemRepository.findOneBy({ id: itemId });
      if (!fromItem) {
        throw new Error('Inventory item not found');
      }

      if (Number(fromItem.quantityOnHand) < quantity) {
        throw new Error('Insufficient quantity for transfer');
      }

      // Reduce from source
      const previousFromQty = Number(fromItem.quantityOnHand);
      fromItem.quantityOnHand = previousFromQty - quantity;
      fromItem.lastMovementDate = new Date();
      await itemRepository.save(fromItem);

      // Record outgoing movement
      const outgoingMovement = movementRepository.create({
        profileId: fromItem.profileId,
        warehouseId: fromItem.warehouseId,
        locationId: fromItem.locationId,
        lotId: fromItem.lotId,
        movementType: MovementType.TRANSFER,
        quantity,
        referenceType,
        referenceId,
        sourceWarehouseId: toWarehouseId,
        performedBy: userId,
        performedAt: new Date(),
        previousQuantity: previousFromQty,
        newQuantity: Number(fromItem.quantityOnHand),
        ipAddress,
      });
      await movementRepository.save(outgoingMovement);

      // Find or create destination item
      let toItem = await itemRepository
        .createQueryBuilder('item')
        .where('item.profileId = :profileId', { profileId: fromItem.profileId })
        .andWhere('item.warehouseId = :warehouseId', { warehouseId: toWarehouseId })
        .andWhere(toLocationId 
          ? 'item.locationId = :locationId' 
          : 'item.locationId IS NULL',
          { locationId: toLocationId || null }
        )
        .getOne();

      if (!toItem) {
        // Create new item at destination
        toItem = itemRepository.create({
          profileId: fromItem.profileId,
          warehouseId: toWarehouseId,
          locationId: toLocationId,
          lotId: fromItem.lotId,
          quantityOnHand: quantity,
          quantityReserved: 0,
          averageUnitCost: fromItem.averageUnitCost,
        });
        await itemRepository.save(toItem);

        // Record initial receipt movement
        const initialMovement = movementRepository.create({
          profileId: toItem.profileId,
          warehouseId: toItem.warehouseId,
          locationId: toItem.locationId,
          lotId: toItem.lotId,
          movementType: MovementType.RECEIPT,
          quantity,
          referenceType: 'TRANSFER',
          referenceId,
          sourceWarehouseId: fromItem.warehouseId,
          performedBy: userId,
          performedAt: new Date(),
          previousQuantity: 0,
          newQuantity: quantity,
          ipAddress,
        });
        await movementRepository.save(initialMovement);
      } else {
        // Update existing destination item
        const previousToQty = Number(toItem.quantityOnHand);
        toItem.quantityOnHand = previousToQty + quantity;
        toItem.lastMovementDate = new Date();
        await itemRepository.save(toItem);

        // Record incoming movement
        const incomingMovement = movementRepository.create({
          profileId: toItem.profileId,
          warehouseId: toItem.warehouseId,
          locationId: toItem.locationId,
          lotId: toItem.lotId,
          movementType: MovementType.TRANSFER,
          quantity,
          referenceType,
          referenceId,
          sourceWarehouseId: fromItem.warehouseId,
          performedBy: userId,
          performedAt: new Date(),
          previousQuantity: previousToQty,
          newQuantity: Number(toItem.quantityOnHand),
          ipAddress,
        });
        await movementRepository.save(incomingMovement);
      }

      return { fromItem, toItem };
    });
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold: number): Promise<InventoryItem[]> {
    return this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.profile', 'profile')
      .leftJoinAndSelect('item.warehouse', 'warehouse')
      .where('item.quantityOnHand <= :threshold', { threshold })
      .andWhere('item.quantityOnHand > 0')
      .orderBy('item.quantityOnHand', 'ASC')
      .getMany();
  }

  /**
   * Get total stock value
   */
  async getTotalStockValue(warehouseId?: string): Promise<number> {
    const query = this.itemRepository.createQueryBuilder('item')
      .select('SUM(item.quantityOnHand * item.averageUnitCost)', 'total');

    if (warehouseId) {
      query.where('item.warehouseId = :warehouseId', { warehouseId });
    }

    const result = await query.getRawOne();
    return Number(result?.total || 0);
  }

  /**
   * Record stock movement
   */
  private async recordMovement(data: {
    profileId: string;
    warehouseId: string;
    locationId?: string;
    lotId?: string;
    movementType: MovementType;
    quantity: number;
    unitCost?: number;
    totalCost?: number;
    referenceType: string;
    referenceId: string;
    sourceWarehouseId?: string;
    notes?: string;
    performedBy: string;
    performedAt: Date;
    previousQuantity: number;
    newQuantity: number;
    ipAddress?: string;
  }): Promise<StockMovement> {
    const movement = this.movementRepository.create({
      ...data,
      totalCost: data.unitCost ? data.quantity * data.unitCost : undefined,
    });

    return this.movementRepository.save(movement);
  }
}
