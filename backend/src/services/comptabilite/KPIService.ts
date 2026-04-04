import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { FinancialKPI, FinancialKPIType } from '../../models/comptabilite/FinancialKPI';
import { ReceivableAging } from '../../models/comptabilite/ReceivableAging';
import { OrderCosting } from '../../models/comptabilite/OrderCosting';
import { Invoice } from '../../models/aluminium/Invoice';
import { calculateDSO } from '../../utils/decimal';

export interface DashboardKPIs {
  revenueMTD: number;
  revenueYTD: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  dso: number;
  outstandingReceivables: number;
}

interface AgingBuckets {
  aging0_30: number;
  aging31_60: number;
  aging61_90: number;
  aging90plus: number;
}

export class KPIService {
  private financialKPIRepository: Repository<FinancialKPI>;
  private receivableAgingRepository: Repository<ReceivableAging>;
  private orderCostingRepository: Repository<OrderCosting>;
  private invoiceRepository: Repository<Invoice>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.financialKPIRepository = ds.getRepository(FinancialKPI);
    this.receivableAgingRepository = ds.getRepository(ReceivableAging);
    this.orderCostingRepository = ds.getRepository(OrderCosting);
    this.invoiceRepository = ds.getRepository(Invoice);
  }

  /**
   * Calculate DSO: (Accounts Receivable / Annual Revenue) * 365
   */
  async calculateDSO(): Promise<number> {
    // Get total outstanding receivables
    const receivables = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount - invoice.paidAmount)', 'total')
      .where('invoice.status != :status', { status: 'paid' })
      .getRawOne();

    const accountsReceivable = parseFloat(receivables?.total || '0');

    // Get annual revenue (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const annualRevenueResult = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('SUM(oc.revenue)', 'total')
      .where('oc.calculatedAt >= :date', { date: oneYearAgo })
      .getRawOne();

    const annualRevenue = parseFloat(annualRevenueResult?.total || '0');

    // Calculate DSO
    const dso = Number(calculateDSO(accountsReceivable, annualRevenue).toFixed(2));

    // Save KPI
    await this.saveKPI(FinancialKPIType.DSO, dso, 'month');

    return dso;
  }

  /**
   * Save KPI record
   */
  private async saveKPI(type: FinancialKPIType, value: number, period: string): Promise<FinancialKPI> {
    const kpi = this.financialKPIRepository.create({
      kpiType: type,
      value,
      period,
    });
    return this.financialKPIRepository.save(kpi);
  }

  /**
   * Calculate receivable aging buckets
   */
  async calculateReceivableAging(): Promise<ReceivableAging[]> {
    const today = new Date();
    
    // Get unpaid invoices grouped by customer and age
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.order', 'order')
      .leftJoin('order.customer', 'customer')
      .select([
        'customer.id as customerId',
        'invoice.dueDate as dueDate',
        'SUM(invoice.totalAmount - invoice.paidAmount) as amount',
      ])
      .where('invoice.status != :status', { status: 'paid' })
      .andWhere('invoice.totalAmount > invoice.paidAmount')
      .groupBy('customer.id')
      .addGroupBy('invoice.dueDate')
      .getRawMany();

    // Process aging buckets - use string keys to avoid numeric issues
    const agingMap = new Map<string, AgingBuckets>();

    for (const invoice of invoices) {
      const customerId = invoice.customerId;
      const amount = parseFloat(invoice.amount || '0');
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!agingMap.has(customerId)) {
        agingMap.set(customerId, { aging0_30: 0, aging31_60: 0, aging61_90: 0, aging90plus: 0 });
      }

      const aging = agingMap.get(customerId)!;
      if (daysOverdue <= 30) {
        aging.aging0_30 += amount;
      } else if (daysOverdue <= 60) {
        aging.aging31_60 += amount;
      } else if (daysOverdue <= 90) {
        aging.aging61_90 += amount;
      } else {
        aging.aging90plus += amount;
      }
    }

    // Save aging records
    const agingRecords: ReceivableAging[] = [];
    for (const [customerId, aging] of agingMap) {
      const total = aging.aging0_30 + aging.aging31_60 + aging.aging61_90 + aging.aging90plus;

      const record = new ReceivableAging();
      record.customerId = customerId;
      record.period = today;
      record.aging_0_30 = aging.aging0_30;
      record.aging_31_60 = aging.aging31_60;
      record.aging_61_90 = aging.aging61_90;
      record.aging_90_plus = aging.aging90plus;
      record.total = total;

      agingRecords.push(await this.receivableAgingRepository.save(record));
    }

    return agingRecords;
  }

  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Revenue MTD
    const revenueMTDResult = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('SUM(oc.revenue)', 'total')
      .where('oc.calculatedAt >= :date', { date: startOfMonth })
      .getRawOne();
    const revenueMTD = parseFloat(revenueMTDResult?.total || '0');

    // Revenue YTD
    const revenueYTDResult = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('SUM(oc.revenue)', 'total')
      .where('oc.calculatedAt >= :date', { date: startOfYear })
      .getRawOne();
    const revenueYTD = parseFloat(revenueYTDResult?.total || '0');

    // Gross Margin (MTD)
    const marginMTDResult = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('SUM(oc.margin)', 'total')
      .addSelect('SUM(oc.revenue)', 'revenue')
      .where('oc.calculatedAt >= :date', { date: startOfMonth })
      .getRawOne();
    const marginMTD = parseFloat(marginMTDResult?.total || '0');
    const revenueForMargin = parseFloat(marginMTDResult?.revenue || '0');
    const grossMarginPercent = revenueForMargin > 0 ? Number(((marginMTD / revenueForMargin) * 100).toFixed(2)) : 0;

    // Outstanding Receivables
    const receivablesResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount - invoice.paidAmount)', 'total')
      .where('invoice.status != :status', { status: 'paid' })
      .getRawOne();
    const outstandingReceivables = parseFloat(receivablesResult?.total || '0');

    // DSO (cached or calculated)
    const dsoRecord = await this.financialKPIRepository.findOne({
      where: { kpiType: FinancialKPIType.DSO },
      order: { calculatedAt: 'DESC' },
    });
    const dso = dsoRecord ? parseFloat(dsoRecord.value.toString()) : 0;

    return {
      revenueMTD,
      revenueYTD,
      grossMarginPercent,
      netMarginPercent: grossMarginPercent,
      dso,
      outstandingReceivables,
    };
  }
}
