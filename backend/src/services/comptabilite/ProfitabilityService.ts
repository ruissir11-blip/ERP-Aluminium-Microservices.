import { AppDataSource } from '../../config/database';
import { CustomerProfitability } from '../../models/comptabilite/CustomerProfitability';
import { Customer } from '../../models/aluminium/Customer';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { Decimal } from 'decimal.js';
import logger from '../../config/logger';
import { kpiCache } from '../../config/kpi-cache';

export class ProfitabilityService {
  private profitabilityRepository = AppDataSource.getRepository(CustomerProfitability);
  private customerRepository = AppDataSource.getRepository(Customer);
  private orderRepository = AppDataSource.getRepository(CustomerOrder);

  /**
   * Calculate profitability for a specific customer
   */
  async calculateCustomerProfitability(customerId: string): Promise<CustomerProfitability> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Get all completed orders for this customer
    const orders = await this.orderRepository.find({
      where: { 
        customerId,
        status: OrderStatus.TERMINÉE,
      },
    });

    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);

    for (const order of orders) {
      totalRevenue = totalRevenue.plus(order.total || 0);
      // Estimate cost as 70% of revenue (in production, use actual costing data)
      const estimatedCost = new Decimal(order.total || 0).times(0.70);
      totalCost = totalCost.plus(estimatedCost);
    }

    const totalMargin = totalRevenue.minus(totalCost);
    const marginPercent = totalCost.gt(0)
      ? totalMargin.div(totalCost).times(100).toNumber()
      : 0;

    // Get or create profitability record
    let profitability = await this.profitabilityRepository.findOne({
      where: { customerId },
    });

    if (!profitability) {
      profitability = new CustomerProfitability();
      profitability.customerId = customerId;
    }

    profitability.totalRevenue = totalRevenue.toNumber();
    profitability.totalCost = totalCost.toNumber();
    profitability.totalMargin = totalMargin.toNumber();
    profitability.marginPercent = marginPercent;
    profitability.orderCount = orders.length;
    profitability.calculatedAt = new Date();

    await this.profitabilityRepository.save(profitability);
    
    // Invalidate cache
    await kpiCache.invalidateKPIs();
    
    logger.info(`Customer profitability calculated for customer ${customerId}`);
    return profitability;
  }

  /**
   * Get all customer profitabilities with pagination
   */
  async getAllProfitabilities(options: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    minMargin?: number;
    maxMargin?: number;
  }): Promise<{ data: CustomerProfitability[]; total: number; page: number; perPage: number; totalPages: number }> {
    const {
      page = 1,
      perPage = 10,
      sortBy = 'marginPercent',
      sortOrder = 'DESC',
      minMargin,
      maxMargin,
    } = options;

    // Try to get from cache first
    const cacheKey = `profitability:list:${page}:${perPage}:${sortBy}:${sortOrder}:${minMargin}:${maxMargin}`;
    const cached = await kpiCache.getKPI<CustomerProfitability[]>(cacheKey);
    
    if (cached) {
      return {
        data: cached,
        total: cached.length,
        page,
        perPage,
        totalPages: Math.ceil(cached.length / perPage),
      };
    }

    const queryBuilder = this.profitabilityRepository.createQueryBuilder('cp');

    // Join with customer
    queryBuilder.leftJoinAndSelect('cp.customer', 'customer');

    // Filters
    if (minMargin !== undefined) {
      queryBuilder.andWhere('cp.marginPercent >= :minMargin', { minMargin });
    }
    if (maxMargin !== undefined) {
      queryBuilder.andWhere('cp.marginPercent <= :maxMargin', { maxMargin });
    }

    // Sorting
    const sortColumn = `cp.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Pagination
    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / perPage);
    
    queryBuilder.skip((page - 1) * perPage).take(perPage);

    const data = await queryBuilder.getMany();

    // Cache the results
    await kpiCache.setKPI(cacheKey, data, 1800); // 30 min cache

    return { data, total, page, perPage, totalPages };
  }

  /**
   * Get customer profitability by customer ID
   */
  async getCustomerProfitabilityById(customerId: string): Promise<CustomerProfitability | null> {
    // Try cache first
    const cached = await kpiCache.getKPI<CustomerProfitability>(`profitability:${customerId}`);
    if (cached) {
      return cached;
    }

    const profitability = await this.profitabilityRepository.findOne({
      where: { customerId },
      relations: ['customer'],
    });

    if (profitability) {
      await kpiCache.setKPI(`profitability:${customerId}`, profitability, 1800);
    }

    return profitability;
  }

  /**
   * Recalculate all customer profitabilities
   */
  async recalculateAll(): Promise<number> {
    const customers = await this.customerRepository.find();

    let count = 0;
    for (const customer of customers) {
      try {
        await this.calculateCustomerProfitability(customer.id);
        count++;
      } catch (error) {
        logger.error(`Error calculating profitability for customer ${customer.id}:`, error);
      }
    }

    return count;
  }
}

export const profitabilityService = new ProfitabilityService();
