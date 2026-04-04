import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { InventoryCount, InventoryCountStatus, CountType } from '../../models/stock/InventoryCount';
import { InventoryCountLine, CountLineStatus } from '../../models/stock/InventoryCountLine';
import { InventoryItem } from '../../models/stock/InventoryItem';

export interface CreateInventoryCountInput {
  warehouseId: string;
  countType: CountType;
  notes?: string;
  initiatedBy: string;
}

export class InventoryCountService {
  private countRepository: Repository<InventoryCount>;
  private lineRepository: Repository<InventoryCountLine>;
  private itemRepository: Repository<InventoryItem>;

  constructor() {
    this.countRepository = AppDataSource.getRepository(InventoryCount);
    this.lineRepository = AppDataSource.getRepository(InventoryCountLine);
    this.itemRepository = AppDataSource.getRepository(InventoryItem);
  }

  /**
   * Get all inventory counts with optional filtering
   */
  async findAll(status?: InventoryCountStatus): Promise<InventoryCount[]> {
    const query = this.countRepository.createQueryBuilder('count')
      .leftJoinAndSelect('count.warehouse', 'warehouse');

    if (status) {
      query.where('count.status = :status', { status });
    }

    return query.orderBy('count.createdAt', 'DESC').getMany();
  }

  /**
   * Get inventory count by ID
   */
  async findById(id: string): Promise<InventoryCount | null> {
    return this.countRepository.findOne({
      where: { id },
      relations: ['warehouse'],
    });
  }

  /**
   * Create new inventory count
   */
  async create(input: CreateInventoryCountInput): Promise<InventoryCount> {
    // Generate count number
    const countNumber = await this.generateCountNumber();

    const count = this.countRepository.create({
      countNumber,
      warehouseId: input.warehouseId,
      countType: input.countType,
      status: InventoryCountStatus.DRAFT,
      notes: input.notes,
      initiatedBy: input.initiatedBy,
    });

    return this.countRepository.save(count);
  }

  /**
   * Start inventory count (generate lines from current inventory)
   */
  async startCount(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status !== InventoryCountStatus.DRAFT) {
      throw new Error('Inventory count already started');
    }

    // Get all inventory items for the warehouse
    const items = await this.itemRepository.find({
      where: { warehouseId: count.warehouseId },
    });

    // Create count lines
    for (const item of items) {
      const line = this.lineRepository.create({
        countId: count.id,
        profileId: item.profileId,
        locationId: item.locationId || '',
        lotId: item.lotId,
        systemQuantity: item.quantityOnHand,
        countStatus: CountLineStatus.PENDING,
      });

      await this.lineRepository.save(line);
    }

    // Update count status
    count.status = InventoryCountStatus.IN_PROGRESS;
    count.startedAt = new Date();

    return this.countRepository.save(count);
  }

  /**
   * Record counted quantity for a line
   */
  async recordCount(
    lineId: string,
    countedQuantity: number,
    userId: string,
    notes?: string
  ): Promise<InventoryCountLine> {
    const line = await this.lineRepository.findOne({
      where: { id: lineId },
      relations: ['count'],
    });

    if (!line) {
      throw new Error('Inventory count line not found');
    }

    if (line.count && line.count.status === InventoryCountStatus.COMPLETED) {
      throw new Error('Inventory count already completed');
    }

    line.countedQuantity = countedQuantity;
    line.countedBy = userId;
    line.countedAt = new Date();
    line.notes = notes;

    // Calculate variance
    const systemQty = Number(line.systemQuantity);
    const countedQty = Number(countedQuantity);
    line.variance = countedQty - systemQty;

    if (systemQty > 0) {
      line.variancePercentage = (line.variance / systemQty) * 100;
    }

    // Update status
    if (line.variance !== 0) {
      line.countStatus = CountLineStatus.VARIANCE;
    } else {
      line.countStatus = CountLineStatus.COUNTED;
    }

    return this.lineRepository.save(line);
  }

  /**
   * Submit count for review
   */
  async submitForReview(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status !== InventoryCountStatus.IN_PROGRESS) {
      throw new Error('Inventory count not in progress');
    }

    count.status = InventoryCountStatus.VARIANCE_REVIEW;

    return this.countRepository.save(count);
  }

  /**
   * Approve adjustments and complete count
   */
  async approveAdjustments(countId: string, userId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status !== InventoryCountStatus.VARIANCE_REVIEW) {
      throw new Error('Inventory count not in variance review');
    }

    // Get all variance lines
    const lines = await this.lineRepository.find({
      where: { countId: count.id, countStatus: CountLineStatus.VARIANCE },
    });

    // Update inventory items
    for (const line of lines) {
      const item = await this.itemRepository.findOne({
        where: {
          profileId: line.profileId,
          warehouseId: count.warehouseId,
          locationId: line.locationId || undefined,
        },
      });

      if (item && line.variance) {
        item.quantityOnHand = Number(item.quantityOnHand) + Number(line.variance);
        item.lastMovementDate = new Date();
        await this.itemRepository.save(item);
      }

      line.isAdjusted = true;
      line.adjustmentPostedAt = new Date();
      await this.lineRepository.save(line);
    }

    count.status = InventoryCountStatus.ADJUSTMENT_APPROVED;
    count.reviewedBy = userId;
    count.reviewedAt = new Date();

    return this.countRepository.save(count);
  }

  /**
   * Complete inventory count
   */
  async complete(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status !== InventoryCountStatus.ADJUSTMENT_APPROVED) {
      throw new Error('Adjustments must be approved before completing');
    }

    count.status = InventoryCountStatus.COMPLETED;
    count.completedAt = new Date();

    return this.countRepository.save(count);
  }

  /**
   * Cancel inventory count
   */
  async cancel(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status === InventoryCountStatus.COMPLETED) {
      throw new Error('Cannot cancel completed count');
    }

    count.status = InventoryCountStatus.CANCELLED;

    return this.countRepository.save(count);
  }

  /**
   * Get count lines
   */
  async getLines(countId: string): Promise<InventoryCountLine[]> {
    return this.lineRepository.find({
      where: { countId },
      relations: ['profile', 'location', 'lot'],
    });
  }

  /**
   * Get count statistics
   */
  async getStatistics(countId: string): Promise<{
    totalLines: number;
    pending: number;
    counted: number;
    variance: number;
    totalVariance: number;
  }> {
    const count = await this.findById(countId);
    if (!count) {
      throw new Error('Inventory count not found');
    }

    const lines = await this.getLines(countId);

    const stats = {
      totalLines: lines.length,
      pending: lines.filter(l => l.countStatus === CountLineStatus.PENDING).length,
      counted: lines.filter(l => l.countStatus === CountLineStatus.COUNTED).length,
      variance: lines.filter(l => l.countStatus === CountLineStatus.VARIANCE).length,
      totalVariance: lines.reduce((sum, l) => sum + Number(l.variance || 0), 0),
    };

    return stats;
  }

  /**
   * Generate unique count number
   */
  private async generateCountNumber(): Promise<string> {
    const date = new Date();
    const prefix = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const lastCount = await this.countRepository
      .createQueryBuilder('count')
      .where('count.countNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('count.countNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastCount) {
      const lastSequence = parseInt(lastCount.countNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }
}
