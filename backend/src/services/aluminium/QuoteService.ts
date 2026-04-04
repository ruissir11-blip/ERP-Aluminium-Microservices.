import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Quote, QuoteStatus } from '../../models/aluminium/Quote';
import { QuoteLine } from '../../models/aluminium/QuoteLine';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { AluminumProfile } from '../../models/aluminium/AluminumProfile';
import { CalculationService } from './CalculationService';
import { Decimal } from 'decimal.js';

export interface CreateQuoteInput {
  customerId: string;
  commercialId: string;
  validUntil?: Date;
  discountPercent?: number;
  vatRate?: number;
  notes?: string;
  customerNotes?: string;
}

export interface QuoteLineInput {
  profileId: string;
  quantity: number;
  unitLength: number;
  unitPrice: number;
  lineDiscount?: number;
  description?: string;
}

export class QuoteService {
  private quoteRepository: Repository<Quote>;
  private quoteLineRepository: Repository<QuoteLine>;
  private customerOrderRepository: Repository<CustomerOrder>;
  private calculationService: CalculationService;
  private dataSource: DataSource;

  constructor() {
    this.quoteRepository = AppDataSource.getRepository(Quote);
    this.quoteLineRepository = AppDataSource.getRepository(QuoteLine);
    this.customerOrderRepository = AppDataSource.getRepository(CustomerOrder);
    this.calculationService = new CalculationService();
    this.dataSource = AppDataSource;
  }

  /**
   * Generate next quote number (format: D-{YYYY}-{SEQUENCE})
   * Uses advisory lock to prevent race conditions
   */
  private async generateQuoteNumber(): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const prefix = `D-${year}-`;
      
      // Use pessimistic lock to prevent concurrent number generation
      const lastQuote = await manager
        .createQueryBuilder(Quote, 'quote')
        .setLock('pessimistic_write')
        .where('quote.quote_number LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('quote.quote_number', 'DESC')
        .getOne();

      let sequence = 1;
      if (lastQuote) {
        const lastSequence = parseInt(lastQuote.quoteNumber.split('-')[2], 10);
        sequence = lastSequence + 1;
      }

      return `${prefix}${sequence.toString().padStart(5, '0')}`;
    });
  }

  /**
   * Create new quote
   */
  async create(input: CreateQuoteInput): Promise<Quote> {
    const validUntil = input.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
    
    const quote = this.quoteRepository.create({
      quoteNumber: await this.generateQuoteNumber(),
      customerId: input.customerId,
      commercialId: input.commercialId,
      status: QuoteStatus.BROUILLON,
      validUntil,
      discountPercent: input.discountPercent || 0,
      vatRate: input.vatRate || 20,
      notes: input.notes,
      customerNotes: input.customerNotes,
      subtotal: 0,
      discountAmount: 0,
      vatAmount: 0,
      total: 0,
    });

    return this.quoteRepository.save(quote);
  }

  /**
   * Get quote by ID with lines
   */
  async findById(id: string): Promise<Quote | null> {
    return this.quoteRepository.findOne({
      where: { id },
      relations: ['lines', 'lines.profile', 'customer'],
    });
  }

  /**
   * List quotes with filtering
   */
  async findAll(filters: { status?: QuoteStatus; customerId?: string; commercialId?: string } = {}): Promise<Quote[]> {
    const query = this.quoteRepository.createQueryBuilder('quote')
      .leftJoinAndSelect('quote.customer', 'customer')
      .leftJoinAndSelect('quote.lines', 'lines');

    if (filters.status) {
      query.andWhere('quote.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      query.andWhere('quote.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.commercialId) {
      query.andWhere('quote.commercialId = :commercialId', { commercialId: filters.commercialId });
    }

    return query.orderBy('quote.createdAt', 'DESC').getMany();
  }

  /**
   * Add line to quote
   */
  async addLine(quoteId: string, input: QuoteLineInput): Promise<QuoteLine> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.BROUILLON) {
      throw new Error('Cannot modify quote lines after quote is sent');
    }

    // Get profile for calculations
    const profileRepository = AppDataSource.getRepository(AluminumProfile);
    const profile = await profileRepository.findOneBy({ id: input.profileId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate weight, surface, and material cost
    const calcResult = this.calculationService.calculateForProfile(profile, {
      length: input.unitLength,
      quantity: input.quantity,
    });

    const sortOrder = quote.lines?.length || 0;

    const line = this.quoteLineRepository.create({
      quoteId,
      profileId: input.profileId,
      quantity: input.quantity,
      unitLength: input.unitLength,
      unitWeight: calcResult.weight.div(input.quantity).toNumber(),
      totalWeight: calcResult.weight.toNumber(),
      unitSurface: calcResult.surface.div(input.quantity).toNumber(),
      totalSurface: calcResult.surface.toNumber(),
      materialCost: calcResult.materialCost.toNumber(),
      unitPrice: input.unitPrice,
      lineDiscount: input.lineDiscount || 0,
      lineTotal: new Decimal(input.unitPrice).times(input.quantity).minus(input.lineDiscount || 0).toNumber(),
      description: input.description || profile.name,
      sortOrder,
    });

    const savedLine = await this.quoteLineRepository.save(line);
    await this.recalculateQuoteTotals(quoteId);

    return savedLine;
  }

  /**
   * Update line in quote
   */
  async updateLine(quoteId: string, lineId: string, input: Partial<QuoteLineInput>): Promise<QuoteLine> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.BROUILLON) {
      throw new Error('Cannot modify quote lines after quote is sent');
    }

    const line = await this.quoteLineRepository.findOneBy({ id: lineId, quoteId });
    if (!line) {
      throw new Error('Line not found');
    }

    // If profile or quantity/length changed, recalculate
    if (input.profileId || input.unitLength || input.quantity) {
      const profileRepository = AppDataSource.getRepository(AluminumProfile);
      const profileId = input.profileId || line.profileId;
      const profile = await profileRepository.findOneBy({ id: profileId });
      if (!profile) {
        throw new Error('Profile not found');
      }

      const length = input.unitLength || line.unitLength;
      const quantity = input.quantity || line.quantity;

      const calcResult = this.calculationService.calculateForProfile(profile, {
        length,
        quantity,
      });

      line.profileId = profileId;
      line.quantity = quantity;
      line.unitLength = length;
      line.unitWeight = calcResult.weight.div(quantity).toNumber();
      line.totalWeight = calcResult.weight.toNumber();
      line.unitSurface = calcResult.surface.div(quantity).toNumber();
      line.totalSurface = calcResult.surface.toNumber();
      line.materialCost = calcResult.materialCost.toNumber();
    }

    if (input.unitPrice !== undefined) {
      line.unitPrice = input.unitPrice;
    }
    if (input.lineDiscount !== undefined) {
      line.lineDiscount = input.lineDiscount;
    }
    if (input.description !== undefined) {
      line.description = input.description;
    }

    // Recalculate line total
    line.lineTotal = new Decimal(line.unitPrice)
      .times(line.quantity)
      .minus(line.lineDiscount || 0)
      .toNumber();

    const savedLine = await this.quoteLineRepository.save(line);
    await this.recalculateQuoteTotals(quoteId);

    return savedLine;
  }

  /**
   * Remove line from quote
   */
  async removeLine(quoteId: string, lineId: string): Promise<void> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.BROUILLON) {
      throw new Error('Cannot modify quote lines after quote is sent');
    }

    const line = await this.quoteLineRepository.findOneBy({ id: lineId, quoteId });
    if (!line) {
      throw new Error('Line not found');
    }

    await this.quoteLineRepository.remove(line);
    await this.recalculateQuoteTotals(quoteId);
  }

  /**
   * Recalculate quote totals
   */
  private async recalculateQuoteTotals(quoteId: string): Promise<void> {
    const quote = await this.findById(quoteId);
    if (!quote) return;

    const lines = quote.lines || [];
    
    // Calculate subtotal
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    
    // Calculate global discount
    const discountAmount = new Decimal(subtotal).times(quote.discountPercent).div(100).toNumber();
    
    // Calculate VAT
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = new Decimal(taxableAmount).times(quote.vatRate).div(100).toNumber();
    
    // Calculate total
    const total = taxableAmount + vatAmount;

    await this.quoteRepository.update(quoteId, {
      subtotal,
      discountAmount,
      vatAmount,
      total,
    });
  }

  /**
   * Send quote (transition to ENVOYÉ)
   */
  async sendQuote(quoteId: string): Promise<Quote> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.BROUILLON) {
      throw new Error('Quote can only be sent from BROUILLON status');
    }

    quote.status = QuoteStatus.ENVOYÉ;
    quote.sentAt = new Date();

    return this.quoteRepository.save(quote);
  }

  /**
   * Accept quote (transition to ACCEPTÉ)
   */
  async acceptQuote(quoteId: string): Promise<Quote> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.ENVOYÉ) {
      throw new Error('Quote can only be accepted from ENVOYÉ status');
    }

    quote.status = QuoteStatus.ACCEPTÉ;
    quote.acceptedAt = new Date();

    return this.quoteRepository.save(quote);
  }

  /**
   * Refuse quote (transition to REFUSÉ)
   */
  async refuseQuote(quoteId: string): Promise<Quote> {
    const quote = await this.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== QuoteStatus.ENVOYÉ) {
      throw new Error('Quote can only be refused from ENVOYÉ status');
    }

    quote.status = QuoteStatus.REFUSÉ;

    return this.quoteRepository.save(quote);
  }

  /**
   * Convert quote to order
   * Uses database transaction to ensure data consistency
   */
  async convertToOrder(quoteId: string, userId: string): Promise<CustomerOrder> {
    return this.dataSource.transaction(async (manager) => {
      // Fetch quote within transaction with lock
      const quote = await manager
        .createQueryBuilder(Quote, 'quote')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('quote.lines', 'lines')
        .where('quote.id = :quoteId', { quoteId })
        .getOne();

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.status !== QuoteStatus.ACCEPTÉ) {
        throw new Error('Quote must be accepted before conversion');
      }

      // Check if already converted
      if (quote.convertedToOrderId) {
        throw new Error('Quote has already been converted to an order');
      }

      const orderNumber = await this.generateOrderNumberWithManager(manager);

      const order = manager.create(CustomerOrder, {
        orderNumber,
        quoteId,
        customerId: quote.customerId,
        commercialId: quote.commercialId,
        status: OrderStatus.EN_ATTENTE,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        vatAmount: quote.vatAmount,
        total: quote.total,
      });

      const savedOrder = await manager.save(order);

      // Update quote with order reference
      await manager.update(Quote, quoteId, { 
        convertedToOrderId: savedOrder.id 
      });

      return savedOrder;
    });
  }

  /**
   * Generate order number (format: CMD-{YYYY}-{SEQUENCE})
   * Uses advisory lock to prevent race conditions
   */
  private async generateOrderNumber(): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      return this.generateOrderNumberWithManager(manager);
    });
  }

  /**
   * Generate order number within a transaction
   */
  private async generateOrderNumberWithManager(manager: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CMD-${year}-`;
    
    // Use pessimistic lock to prevent concurrent number generation
    const lastOrder = await manager
      .createQueryBuilder(CustomerOrder, 'order')
      .setLock('pessimistic_write')
      .where('order.order_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.order_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`;
  }
}
