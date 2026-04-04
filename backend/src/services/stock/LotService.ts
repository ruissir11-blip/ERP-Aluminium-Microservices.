import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Lot, LotQualityStatus } from '../../models/stock/Lot';
import { LotTraceability, TraceabilityEventType } from '../../models/stock/LotTraceability';

export interface CreateLotInput {
  lotNumber: string;
  profileId: string;
  supplierId: string;
  receiptDate: Date;
  initialQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  certificateOfConformity?: string;
  expiryDate?: Date;
  notes?: string;
}

export interface UpdateLotInput extends Partial<CreateLotInput> {
  qualityStatus?: LotQualityStatus;
}

export class LotService {
  private lotRepository: Repository<Lot>;
  private traceabilityRepository: Repository<LotTraceability>;

  constructor() {
    this.lotRepository = AppDataSource.getRepository(Lot);
    this.traceabilityRepository = AppDataSource.getRepository(LotTraceability);
  }

  /**
   * Get all lots with optional filtering
   */
  async findAll(profileId?: string, supplierId?: string, qualityStatus?: LotQualityStatus): Promise<Lot[]> {
    const query = this.lotRepository.createQueryBuilder('lot')
      .leftJoinAndSelect('lot.profile', 'profile')
      .leftJoinAndSelect('lot.supplier', 'supplier');

    if (profileId) {
      query.andWhere('lot.profileId = :profileId', { profileId });
    }

    if (supplierId) {
      query.andWhere('lot.supplierId = :supplierId', { supplierId });
    }

    if (qualityStatus) {
      query.andWhere('lot.qualityStatus = :qualityStatus', { qualityStatus });
    }

    return query.orderBy('lot.receiptDate', 'DESC').getMany();
  }

  /**
   * Get lot by ID
   */
  async findById(id: string): Promise<Lot | null> {
    return this.lotRepository.findOne({
      where: { id },
      relations: ['profile', 'supplier'],
    });
  }

  /**
   * Get lot by lot number
   */
  async findByLotNumber(lotNumber: string): Promise<Lot | null> {
    return this.lotRepository.findOne({
      where: { lotNumber },
      relations: ['profile', 'supplier'],
    });
  }

  /**
   * Create new lot
   */
  async create(input: CreateLotInput): Promise<Lot> {
    // Check for duplicate lot number
    const existing = await this.findByLotNumber(input.lotNumber);
    if (existing) {
      throw new Error(`Lot with number '${input.lotNumber}' already exists`);
    }

    const lot = this.lotRepository.create({
      ...input,
      qualityStatus: LotQualityStatus.QUARANTINE,
    });

    const savedLot = await this.lotRepository.save(lot);

    // Create initial traceability record
    await this.recordTraceabilityEvent({
      lotId: savedLot.id,
      eventType: TraceabilityEventType.RECEIPT,
      eventDate: new Date(),
      referenceType: 'LOT_CREATION',
      referenceId: savedLot.id,
      quantity: input.initialQuantity,
      remainingQuantity: input.remainingQuantity,
      path: `/lots/${savedLot.id}`,
    });

    return savedLot;
  }

  /**
   * Update existing lot
   */
  async update(id: string, input: UpdateLotInput): Promise<Lot> {
    const lot = await this.findById(id);
    if (!lot) {
      throw new Error('Lot not found');
    }

    Object.assign(lot, input);
    return this.lotRepository.save(lot);
  }

  /**
   * Update lot quality status
   */
  async updateQualityStatus(id: string, status: LotQualityStatus): Promise<Lot> {
    const lot = await this.findById(id);
    if (!lot) {
      throw new Error('Lot not found');
    }

    lot.qualityStatus = status;
    return this.lotRepository.save(lot);
  }

  /**
   * Get traceability history for a lot
   */
  async getTraceabilityHistory(lotId: string): Promise<LotTraceability[]> {
    return this.traceabilityRepository.find({
      where: { lotId },
      order: { eventDate: 'DESC' },
    });
  }

  /**
   * Record a traceability event
   */
  async recordTraceabilityEvent(data: {
    lotId: string;
    parentTraceabilityId?: string;
    eventType: TraceabilityEventType;
    eventDate: Date;
    referenceType: string;
    referenceId: string;
    quantity: number;
    remainingQuantity: number;
    path: string;
  }): Promise<LotTraceability> {
    const traceability = this.traceabilityRepository.create(data);
    return this.traceabilityRepository.save(traceability);
  }

  /**
   * Trace lot forward (from source to destination)
   */
  async traceForward(lotId: string): Promise<LotTraceability[]> {
    return this.traceabilityRepository.find({
      where: { lotId },
      order: { eventDate: 'ASC' },
    });
  }

  /**
   * Trace lot by reference
   */
  async traceByReference(referenceType: string, referenceId: string): Promise<LotTraceability[]> {
    return this.traceabilityRepository.find({
      where: { referenceType, referenceId },
      order: { eventDate: 'DESC' },
    });
  }

  /**
   * Get lots by quality status
   */
  async findByQualityStatus(status: LotQualityStatus): Promise<Lot[]> {
    return this.lotRepository.find({
      where: { qualityStatus: status },
      relations: ['profile', 'supplier'],
      order: { receiptDate: 'DESC' },
    });
  }

  /**
   * Get expiring lots within days
   */
  async getExpiringLots(days: number): Promise<Lot[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.lotRepository.createQueryBuilder('lot')
      .leftJoinAndSelect('lot.profile', 'profile')
      .leftJoinAndSelect('lot.supplier', 'supplier')
      .where('lot.expiryDate IS NOT NULL')
      .andWhere('lot.expiryDate <= :futureDate', { futureDate })
      .andWhere('lot.remainingQuantity > 0')
      .orderBy('lot.expiryDate', 'ASC')
      .getMany();
  }
}
