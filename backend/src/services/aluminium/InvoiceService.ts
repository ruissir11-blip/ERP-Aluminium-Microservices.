import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Invoice, InvoiceStatus } from '../../models/aluminium/Invoice';
import { CustomerOrder, OrderStatus } from '../../models/aluminium/CustomerOrder';
import { sendEmail } from '../../config/email';
import Decimal from 'decimal.js';

export interface CreateInvoiceInput {
  orderId: string;
  customerId: string;
  invoiceDate?: Date;
  dueDate?: Date;
  vatRate?: number;
  notes?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  paymentMethod?: string;
  paymentDate?: Date;
  paymentReference?: string;
  notes?: string;
}

export class InvoiceService {
  private invoiceRepository: Repository<Invoice>;
  private orderRepository: Repository<CustomerOrder>;

  constructor() {
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
    this.orderRepository = AppDataSource.getRepository(CustomerOrder);
  }

  /**
   * Get all invoices with optional filtering
   */
  async findAll(filters: {
    customerId?: string;
    status?: InvoiceStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<Invoice[]> {
    const query = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.order', 'order');

    if (filters.customerId) {
      query.andWhere('invoice.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.startDate) {
      query.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });
    }

    return query.orderBy('invoice.invoiceDate', 'DESC').getMany();
  }

  /**
   * Get invoice by ID
   */
  async findById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'order'],
    });
  }

  /**
   * Get invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['customer', 'order'],
    });
  }

  /**
   * Create invoice from order
   */
  async createFromOrder(input: CreateInvoiceInput): Promise<Invoice> {
    // Get order
    const order = await this.orderRepository.findOne({
      where: { id: input.orderId },
      relations: ['customer'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if invoice already exists
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { orderId: input.orderId },
    });

    if (existingInvoice) {
      throw new Error('Invoice already exists for this order');
    }

    // Check order status
    if (order.status !== OrderStatus.LIVRÉE && order.status !== OrderStatus.TERMINÉE) {
      throw new Error('Order must be delivered or completed before invoicing');
    }

    // Calculate amounts
    const vatRate = input.vatRate || 20;
    const subtotal = new Decimal(order.total.toString());
    const vatAmount = subtotal.mul(vatRate).div(100);
    const total = subtotal.add(vatAmount);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Default due date is 30 days from invoice date
    const invoiceDate = input.invoiceDate || new Date();
    const dueDate = input.dueDate || new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      orderId: input.orderId,
      customerId: input.customerId,
      invoiceDate,
      dueDate,
      vatRate,
      subtotal: subtotal.toNumber(),
      vatAmount: vatAmount.toNumber(),
      total: total.toNumber(),
      amountDue: total.toNumber(),
      amountPaid: 0,
      status: InvoiceStatus.BROUILLON,
      notes: input.notes,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Update order status to FACTURÉE
    order.status = OrderStatus.FACTURÉE;
    await this.orderRepository.save(order);

    return savedInvoice;
  }

  /**
   * Update invoice
   */
  async update(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    Object.assign(invoice, input);
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Validate invoice (change from draft to validated)
   */
  async validate(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.BROUILLON) {
      throw new Error('Only draft invoices can be validated');
    }

    invoice.status = InvoiceStatus.VALIDÉE;
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Send invoice to customer
   */
  async send(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.VALIDÉE) {
      throw new Error('Only validated invoices can be sent');
    }

    invoice.status = InvoiceStatus.ENVOYÉE;
    invoice.sentAt = new Date();
    
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Send email notification
    try {
      if (invoice.customer?.email) {
        await sendEmail({
          to: [invoice.customer.email],
          subject: `Facture ${invoice.invoiceNumber}`,
          text: `Madame, Monsieur,\n\nVeuillez trouver ci-joint la facture ${invoice.invoiceNumber} d'un montant de ${invoice.total} €.\n\nDate d'échéance: ${invoice.dueDate.toLocaleDateString()}\n\nCordialement,\nL'équipe Aluminium ERP`,
        });
      }
    } catch (error) {
      console.error('Failed to send invoice email:', error);
    }

    return savedInvoice;
  }

  /**
   * Record payment
   */
  async recordPayment(
    id: string,
    amount: number,
    paymentMethod: string,
    paymentDate: Date,
    paymentReference?: string
  ): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.ANNULÉE) {
      throw new Error('Cannot record payment on cancelled invoice');
    }

    const previousPaid = new Decimal(invoice.amountPaid.toString());
    const newPaid = previousPaid.add(amount);
    const total = new Decimal(invoice.total.toString());

    invoice.amountPaid = newPaid.toNumber();
    invoice.amountDue = total.sub(newPaid).toNumber();
    invoice.paymentMethod = paymentMethod as any;
    invoice.paymentDate = paymentDate;
    invoice.paymentReference = paymentReference;

    // Update status based on payment
    if (invoice.amountDue <= 0) {
      invoice.status = InvoiceStatus.PAYÉE;
      invoice.paidAt = new Date();
    }

    return this.invoiceRepository.save(invoice);
  }

  /**
   * Cancel invoice
   */
  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAYÉE) {
      throw new Error('Cannot cancel paid invoice');
    }

    invoice.status = InvoiceStatus.ANNULÉE;
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    
    return this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .where('invoice.status NOT IN (:...statuses)', { 
        statuses: [InvoiceStatus.PAYÉE, InvoiceStatus.ANNULÉE, InvoiceStatus.BROUILLON] 
      })
      .andWhere('invoice.dueDate < :today', { today })
      .getMany();
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    totalDue: number;
    overdueCount: number;
    invoiceCount: number;
  }> {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (startDate) {
      query.andWhere('invoice.invoiceDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.invoiceDate <= :endDate', { endDate });
    }

    const invoices = await query.getMany();

    const stats = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalDue: 0,
      overdueCount: 0,
      invoiceCount: 0,
    };

    invoices.forEach((inv) => {
      stats.totalInvoiced += Number(inv.total);
      stats.totalPaid += Number(inv.amountPaid);
      stats.totalDue += Number(inv.amountDue);
      stats.invoiceCount++;
    });

    return stats;
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const prefix = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(5, '0')}`;
  }
}
