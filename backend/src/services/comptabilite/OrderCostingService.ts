import { AppDataSource } from '../../config/database';
import { OrderCosting } from '../../models/comptabilite/OrderCosting';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { ProductCost } from '../../models/comptabilite/ProductCost';
import { Decimal } from 'decimal.js';
import logger from '../../config/logger';

export class OrderCostingService {
  private orderCostingRepository = AppDataSource.getRepository(OrderCosting);
  private orderRepository = AppDataSource.getRepository(CustomerOrder);
  private productCostRepository = AppDataSource.getRepository(ProductCost);

  /**
   * Calculate complete costing for an order
   */
  async calculateOrderCosting(orderId: string): Promise<OrderCosting> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer'],
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Get product cost for this order - in a real app, you'd get order lines
    // For now, we'll calculate based on order total
    const total = new Decimal(order.total || 0);
    
    // Estimate costs based on percentages (in production, use actual order lines)
    const materialCost = total.times(0.55); // 55% material
    const laborCost = total.times(0.25);   // 25% labor  
    const overheadCost = total.times(0.20); // 20% overhead
    
    const totalCost = materialCost.plus(laborCost).plus(overheadCost);
    const revenue = total;
    const margin = revenue.minus(totalCost);
    const marginPercent = totalCost.gt(0) 
      ? margin.div(totalCost).times(100).toNumber()
      : 0;

    // Get or create costing record
    let costing = await this.orderCostingRepository.findOne({
      where: { orderId },
    });

    if (!costing) {
      costing = new OrderCosting();
      costing.orderId = orderId;
    }

    // Store estimated margin for variance tracking
    const estimatedMargin = costing.margin ?? margin.toNumber();
    const marginVariance = margin.toNumber() - estimatedMargin;

    costing.materialCost = materialCost.toNumber();
    costing.laborCost = laborCost.toNumber();
    costing.overheadCost = overheadCost.toNumber();
    costing.totalCost = totalCost.toNumber();
    costing.revenue = revenue.toNumber();
    costing.margin = margin.toNumber();
    costing.marginPercent = marginPercent;
    costing.estimatedMargin = estimatedMargin;
    costing.actualMargin = margin.toNumber();
    costing.marginVariance = marginVariance;
    costing.calculatedAt = new Date();

    await this.orderCostingRepository.save(costing);
    logger.info(`Order costing calculated for order ${orderId}`);

    return costing;
  }

  /**
   * Get all order costings with pagination
   */
  async getAllOrderCostings(options: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    minMargin?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: OrderCosting[]; total: number; page: number; perPage: number; totalPages: number }> {
    const {
      page = 1,
      perPage = 10,
      sortBy = 'calculatedAt',
      sortOrder = 'DESC',
      minMargin,
    } = options;

    const queryBuilder = this.orderCostingRepository.createQueryBuilder('oc');

    // Join with order
    queryBuilder.leftJoinAndSelect('oc.order', 'order');

    // Filters
    if (minMargin !== undefined) {
      queryBuilder.andWhere('oc.marginPercent >= :minMargin', { minMargin });
    }

    // Sorting
    const sortColumn = `oc.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Pagination
    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / perPage);
    
    queryBuilder.skip((page - 1) * perPage).take(perPage);

    const data = await queryBuilder.getMany();

    return { data, total, page, perPage, totalPages };
  }

  /**
   * Get order costing by order ID
   */
  async getOrderCostingByOrderId(orderId: string): Promise<OrderCosting | null> {
    return this.orderCostingRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }

  /**
   * Recalculate all order costings
   */
  async recalculateAll(): Promise<number> {
    const orders = await this.orderRepository.find({
      where: { status: OrderStatus.TERMINÉE },
    });

    let count = 0;
    for (const order of orders) {
      try {
        await this.calculateOrderCosting(order.id);
        count++;
      } catch (error) {
        logger.error(`Error calculating costing for order ${order.id}:`, error);
      }
    }

    return count;
  }
}

export const orderCostingService = new OrderCostingService();
