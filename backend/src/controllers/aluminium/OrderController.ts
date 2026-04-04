import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { Quote } from '../../models/aluminium/Quote';
import { QuoteStatus } from '../../models/aluminium/Quote';

const orderRepository = () => AppDataSource.getRepository(CustomerOrder);
const quoteRepository = () => AppDataSource.getRepository(Quote);

export class OrderController {
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, perPage = 10, status, customerId } = req.query;
      const skip = (Number(page) - 1) * Number(perPage);

      const query = orderRepository().createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer');

      if (status) {
        query.andWhere('order.status = :status', { status });
      }

      if (customerId) {
        query.andWhere('order.customerId = :customerId', { customerId });
      }

      const [orders, total] = await query
        .orderBy('order.createdAt', 'DESC')
        .skip(skip)
        .take(Number(perPage))
        .getManyAndCount();

      // Convert numeric fields from string to number (TypeORM returns numeric as string)
      const convertedOrders = orders.map(order => ({
        ...order,
        subtotal: order.subtotal ? Number(order.subtotal) : 0,
        discountPercent: order.discountPercent ? Number(order.discountPercent) : 0,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
        vatRate: order.vatRate ? Number(order.vatRate) : 0,
        vatAmount: order.vatAmount ? Number(order.vatAmount) : 0,
        total: order.total ? Number(order.total) : 0,
      }));

      return res.json({
        success: true,
        data: {
          data: convertedOrders,
          total,
          page: Number(page),
          perPage: Number(perPage),
          totalPages: Math.ceil(total / Number(perPage))
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to fetch orders' } 
      });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const order = await orderRepository().findOne({
        where: { id },
        relations: ['customer', 'quote']
      });

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          error: { message: 'Order not found' } 
        });
      }

      // Convert numeric fields from string to number (TypeORM returns numeric as string)
      const orderResponse = {
        ...order,
        subtotal: order.subtotal ? Number(order.subtotal) : 0,
        discountPercent: order.discountPercent ? Number(order.discountPercent) : 0,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
        vatRate: order.vatRate ? Number(order.vatRate) : 0,
        vatAmount: order.vatAmount ? Number(order.vatAmount) : 0,
        total: order.total ? Number(order.total) : 0,
      };

      return res.json({ success: true, data: orderResponse });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to fetch order' } 
      });
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { customerId, quoteId, deliveryDate, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: { message: 'Unauthorized' } 
        });
      }

      // If quoteId is provided, convert from quote
      let orderData: Partial<CustomerOrder> = {
        customerId,
        commercialId: userId,
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        notes,
        status: OrderStatus.EN_ATTENTE,
        subtotal: 0,
        discountPercent: 0,
        discountAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        total: 0
      };

      if (quoteId) {
        const quote = await quoteRepository().findOne({
          where: { id: quoteId },
          relations: ['lines']
        });

        if (!quote) {
          return res.status(404).json({ 
            success: false, 
            error: { message: 'Quote not found' } 
          });
        }

        // Copy data from quote
        orderData = {
          ...orderData,
          quoteId,
          subtotal: quote.subtotal,
          discountPercent: quote.discountPercent,
          discountAmount: quote.discountAmount,
          vatRate: quote.vatRate,
          vatAmount: quote.vatAmount,
          total: quote.total,
        };

        // Update quote status
        await quoteRepository().update(quoteId, {
          status: QuoteStatus.CONVERTED
        });
      }

      // Generate order number
      const lastOrder = await orderRepository()
        .createQueryBuilder('order')
        .where('order.orderNumber LIKE :prefix', { prefix: 'CMD-2026-%' })
        .orderBy('order.orderNumber', 'DESC')
        .getOne();

      let nextNumber = 1;
      if (lastOrder) {
        const lastNum = parseInt(lastOrder.orderNumber.replace('CMD-2026-', ''));
        nextNumber = lastNum + 1;
      }

      const orderNumber = `CMD-2026-${nextNumber.toString().padStart(5, '0')}`;

      const order = orderRepository().create({
        ...orderData,
        orderNumber
      });

      const savedOrder = await orderRepository().save(order);

      // Convert numeric fields from string to number (TypeORM returns numeric as string)
      const orderResponse = {
        ...savedOrder,
        subtotal: savedOrder.subtotal ? Number(savedOrder.subtotal) : 0,
        discountPercent: savedOrder.discountPercent ? Number(savedOrder.discountPercent) : 0,
        discountAmount: savedOrder.discountAmount ? Number(savedOrder.discountAmount) : 0,
        vatRate: savedOrder.vatRate ? Number(savedOrder.vatRate) : 0,
        vatAmount: savedOrder.vatAmount ? Number(savedOrder.vatAmount) : 0,
        total: savedOrder.total ? Number(savedOrder.total) : 0,
      };

      return res.status(201).json({ success: true, data: orderResponse });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to create order' } 
      });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await orderRepository().findOne({
        where: { id }
      });

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          error: { message: 'Order not found' } 
        });
      }

      await orderRepository().update(id, { 
        status: status as OrderStatus 
      });

      const updatedOrder = await orderRepository().findOne({
        where: { id }
      });

      return res.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to update order status' } 
      });
    }
  }
}

export const orderController = new OrderController();
