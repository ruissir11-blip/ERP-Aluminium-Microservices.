import { AppDataSource } from '../../config/database';
import { CommercialPerformance } from '../../models/comptabilite/CommercialPerformance';
import { User } from '../../models/User';
import { Quote } from '../../models/aluminium/Quote';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { Decimal } from 'decimal.js';
import logger from '../../config/logger';
import { kpiCache } from '../../config/kpi-cache';

export class CommercialPerformanceService {
  private performanceRepository = AppDataSource.getRepository(CommercialPerformance);
  private userRepository = AppDataSource.getRepository(User);
  private quoteRepository = AppDataSource.getRepository(Quote);
  private orderRepository = AppDataSource.getRepository(CustomerOrder);

  /**
   * Calculate performance for a specific commercial
   */
  async calculateCommercialPerformance(commercialId: string, periodStart: Date, periodEnd: Date): Promise<CommercialPerformance> {
    const commercial = await this.userRepository.findOne({
      where: { id: commercialId },
    });

    if (!commercial) {
      throw new Error(`Commercial ${commercialId} not found`);
    }

    // Get completed orders for this commercial in the period
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.commercialId = :commercialId', { commercialId })
      .andWhere('order.status = :status', { status: OrderStatus.TERMINÉE })
      .andWhere('order.createdAt >= :periodStart', { periodStart })
      .andWhere('order.createdAt <= :periodEnd', { periodEnd })
      .getMany();

    // Get quotes for this commercial in the period
    const quotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.commercialId = :commercialId', { commercialId })
      .andWhere('quote.createdAt >= :periodStart', { periodStart })
      .andWhere('quote.createdAt <= :periodEnd', { periodEnd })
      .getMany();

    let revenue = new Decimal(0);
    let margin = new Decimal(0);

    for (const order of orders) {
      revenue = revenue.plus(order.total || 0);
      margin = margin.plus(new Decimal(order.total || 0).times(0.30));
    }

    const quoteCount = quotes.length;
    const orderCount = orders.length;
    const conversionRate = quoteCount > 0
      ? (orderCount / quoteCount) * 100
      : 0;

    // Get target revenue (could be from a settings table in production)
    const targetRevenue = 50000;

    // Get or create performance record
    let performance = await this.performanceRepository.findOne({
      where: { commercialId, periodStart },
    });

    if (!performance) {
      performance = new CommercialPerformance();
      performance.commercialId = commercialId;
      performance.periodStart = periodStart;
      performance.periodEnd = periodEnd;
    }

    performance.revenue = revenue.toNumber();
    performance.margin = margin.toNumber();
    performance.orderCount = orderCount;
    performance.conversionRate = conversionRate;
    performance.targetRevenue = targetRevenue;
    performance.achievementPct = revenue.gt(0)
      ? revenue.div(targetRevenue).times(100).toNumber()
      : 0;
    performance.calculatedAt = new Date();

    await this.performanceRepository.save(performance);
    
    // Invalidate cache
    await kpiCache.invalidateKPIs();
    
    logger.info(`Commercial performance calculated for ${commercialId}`);
    return performance;
  }

  /**
   * Get all commercial performances
   */
  async getAllPerformances(options: {
    page?: number;
    perPage?: number;
    periodStart?: Date;
  }): Promise<{ data: CommercialPerformance[]; total: number; page: number; perPage: number; totalPages: number }> {
    const { page = 1, perPage = 10, periodStart } = options;

    const queryBuilder = this.performanceRepository.createQueryBuilder('cp');

    if (periodStart) {
      queryBuilder.andWhere('cp.periodStart = :periodStart', { periodStart });
    }

    queryBuilder.orderBy('cp.revenue', 'DESC');

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / perPage);
    
    queryBuilder.skip((page - 1) * perPage).take(perPage);

    const data = await queryBuilder.getMany();

    return { data, total, page, perPage, totalPages };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(periodStart: Date, limit: number = 10): Promise<any[]> {
    const cacheKey = `leaderboard:${periodStart.toISOString()}:${limit}`;
    const cached = await kpiCache.getKPI<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const performances = await this.performanceRepository
      .createQueryBuilder('cp')
      .where('cp.periodStart = :periodStart', { periodStart })
      .orderBy('cp.revenue', 'DESC')
      .limit(limit)
      .getMany();

    const leaderboard = await Promise.all(
      performances.map(async (perf, index) => {
        const commercial = await this.userRepository.findOne({
          where: { id: perf.commercialId },
        });
        
        return {
          commercialId: perf.commercialId,
          commercialName: commercial 
            ? `${commercial.firstName} ${commercial.lastName}`
            : 'Unknown',
          totalRevenue: perf.revenue,
          marginPercent: perf.margin,
          conversionRate: perf.conversionRate,
          achievementPercent: perf.achievementPct,
          rank: index + 1,
        };
      })
    );

    await kpiCache.setKPI(cacheKey, leaderboard, 1800);
    
    return leaderboard;
  }

  /**
   * Recalculate all performances for a period
   */
  async recalculateAll(periodStart: Date, periodEnd: Date): Promise<number> {
    const commercials = await this.userRepository.find();

    let count = 0;
    for (const commercial of commercials) {
      try {
        await this.calculateCommercialPerformance(commercial.id, periodStart, periodEnd);
        count++;
      } catch (error) {
        logger.error(`Error calculating performance for ${commercial.id}:`, error);
      }
    }

    return count;
  }
}

export const commercialPerformanceService = new CommercialPerformanceService();
