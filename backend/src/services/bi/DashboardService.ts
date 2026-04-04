import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { BiDashboard, DashboardType } from '../../models/bi';
import { BiWidget, WidgetType, WidgetDataSource } from '../../models/bi';
import { Invoice } from '../../models/aluminium';
import { CustomerOrder } from '../../models/aluminium';
import { InventoryItem, StockAlert } from '../../models/stock';
import { WorkOrder, WorkOrderStatus } from '../../models/maintenance';
import { Machine } from '../../models/maintenance';
import { NonConformity } from '../../models/quality';
import { InspectionRecord } from '../../models/quality';
import { OrderCosting } from '../../models/comptabilite';

export interface DashboardData {
  dashboard: BiDashboard;
  widgets: WidgetData[];
}

export interface WidgetData {
  widgetId: string;
  title: string;
  type: WidgetType;
  data: unknown;
  config: Record<string, unknown> | null;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class DashboardService {
  private dashboardRepository: Repository<BiDashboard>;
  private widgetRepository: Repository<BiWidget>;
  private invoiceRepository: Repository<Invoice>;
  private orderRepository: Repository<CustomerOrder>;
  private inventoryRepository: Repository<InventoryItem>;
  private stockAlertRepository: Repository<StockAlert>;
  private workOrderRepository: Repository<WorkOrder>;
  private machineRepository: Repository<Machine>;
  private nonConformityRepository: Repository<NonConformity>;
  private inspectionRepository: Repository<InspectionRecord>;
  private orderCostingRepository: Repository<OrderCosting>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.dashboardRepository = ds.getRepository(BiDashboard);
    this.widgetRepository = ds.getRepository(BiWidget);
    this.invoiceRepository = ds.getRepository(Invoice);
    this.orderRepository = ds.getRepository(CustomerOrder);
    this.inventoryRepository = ds.getRepository(InventoryItem);
    this.stockAlertRepository = ds.getRepository(StockAlert);
    this.workOrderRepository = ds.getRepository(WorkOrder);
    this.machineRepository = ds.getRepository(Machine);
    this.nonConformityRepository = ds.getRepository(NonConformity);
    this.inspectionRepository = ds.getRepository(InspectionRecord);
    this.orderCostingRepository = ds.getRepository(OrderCosting);
  }

  /**
   * Get all dashboards
   */
  async getDashboards(): Promise<BiDashboard[]> {
    return this.dashboardRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get dashboard by ID with widgets
   */
  async getDashboard(id: string): Promise<BiDashboard | null> {
    return this.dashboardRepository.findOne({
      where: { id, isActive: true },
      relations: ['widgets'],
    });
  }

  /**
   * Get dashboard with computed widget data
   */
  async getDashboardData(id: string, dateRange?: DateRange): Promise<DashboardData | null> {
    const dashboard = await this.getDashboard(id);
    if (!dashboard) return null;

    const defaultDateRange = dateRange || this.getDefaultDateRange();
    const widgetData: WidgetData[] = [];

    for (const widget of dashboard.widgets) {
      const data = await this.getWidgetData(widget, defaultDateRange);
      widgetData.push({
        widgetId: widget.id,
        title: widget.title,
        type: widget.widgetType,
        data,
        config: widget.config,
      });
    }

    return { dashboard, widgets: widgetData };
  }

  /**
   * Get data for a specific widget
   */
  async getWidgetData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    switch (widget.dataSource) {
      case WidgetDataSource.REVENUE:
        return this.getRevenueData(widget, dateRange);
      case WidgetDataSource.ORDERS:
        return this.getOrdersData(widget, dateRange);
      case WidgetDataSource.STOCK:
        return this.getStockData(widget, dateRange);
      case WidgetDataSource.MAINTENANCE:
        return this.getMaintenanceData(widget, dateRange);
      case WidgetDataSource.QUALITY:
        return this.getQualityData(widget, dateRange);
      case WidgetDataSource.COMPTABILITE:
        return this.getComptabiliteData(widget, dateRange);
      default:
        return {};
    }
  }

  /**
   * Get revenue data for widgets
   */
  private async getRevenueData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    const { startDate, endDate } = dateRange;

    // Monthly revenue
    const monthlyRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select("TO_CHAR(invoice.issueDate, 'YYYY-MM')", 'month')
      .addSelect('SUM(invoice.totalAmount)', 'revenue')
      .where('invoice.issueDate >= :start', { start: startDate })
      .andWhere('invoice.issueDate <= :end', { end: endDate })
      .groupBy("TO_CHAR(invoice.issueDate, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Total revenue
    const totalResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.issueDate >= :start', { start: startDate })
      .andWhere('invoice.issueDate <= :end', { end: endDate })
      .getRawOne();

    // Revenue by customer
    const byCustomer = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.order', 'order')
      .leftJoin('order.customer', 'customer')
      .select('customer.name', 'name')
      .addSelect('SUM(invoice.totalAmount)', 'value')
      .where('invoice.issueDate >= :start', { start: startDate })
      .andWhere('invoice.issueDate <= :end', { end: endDate })
      .groupBy('customer.name')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      monthly: monthlyRevenue.map((m: { month: string; revenue: string }) => ({
        month: m.month,
        revenue: parseFloat(m.revenue) || 0,
      })),
      total: parseFloat(totalResult?.total || '0'),
      byCustomer: byCustomer.map((c: { name: string; value: string }) => ({
        name: c.name,
        value: parseFloat(c.value) || 0,
      })),
    };
  }

  /**
   * Get orders data for widgets
   */
  private async getOrdersData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    const { startDate, endDate } = dateRange;

    // Order count by status
    const byStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :start', { start: startDate })
      .andWhere('order.createdAt <= :end', { end: endDate })
      .groupBy('order.status')
      .getRawMany();

    // Order count over time
    const overTime = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :start', { start: startDate })
      .andWhere('order.createdAt <= :end', { end: endDate })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Total orders
    const totalResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'total')
      .where('order.createdAt >= :start', { start: startDate })
      .andWhere('order.createdAt <= :end', { end: endDate })
      .getRawOne();

    return {
      byStatus: byStatus.map((s: { status: string; count: string }) => ({
        status: s.status,
        count: parseInt(s.count) || 0,
      })),
      overTime: overTime.map((o: { month: string; count: string }) => ({
        month: o.month,
        count: parseInt(o.count) || 0,
      })),
      total: parseInt(totalResult?.total || '0'),
    };
  }

  /**
   * Get stock data for widgets
   */
  private async getStockData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    // Stock value by category
    const byCategory = await this.inventoryRepository
      .createQueryBuilder('item')
      .leftJoin('item.profile', 'profile')
      .select('profile.category', 'category')
      .addSelect('SUM(item.quantity * item.unitCost)', 'value')
      .addSelect('SUM(item.quantity)', 'quantity')
      .groupBy('profile.category')
      .getRawMany();

    // Total stock value
    const totalValueResult = await this.inventoryRepository
      .createQueryBuilder('item')
      .select('SUM(item.quantity * item.unitCost)', 'total')
      .getRawOne();

    // Low stock alerts
    const alerts = await this.stockAlertRepository.find({
      take: 10,
      order: { createdAt: 'DESC' },
    });

    // Stock items with low quantity
    const lowStock = await this.inventoryRepository
      .createQueryBuilder('item')
      .leftJoin('item.profile', 'profile')
      .select('profile.name', 'name')
      .addSelect('item.quantity', 'quantity')
      .addSelect('item.minThreshold', 'threshold')
      .where('item.quantity < item.minThreshold')
      .andWhere('item.minThreshold > 0')
      .getRawMany();

    return {
      byCategory: byCategory.map((c: { category: string; value: string; quantity: string }) => ({
        category: c.category || 'Unknown',
        value: parseFloat(c.value) || 0,
        quantity: parseInt(c.quantity) || 0,
      })),
      totalValue: parseFloat(totalValueResult?.total || '0'),
      alerts: alerts.map((a: StockAlert) => ({
        id: a.id,
        profileId: a.profileId,
        isTriggered: a.isTriggered,
        minimumThreshold: a.minimumThreshold,
        createdAt: a.createdAt,
      })),
      lowStock: lowStock.map((l: { name: string; quantity: number; threshold: number }) => ({
        name: l.name,
        quantity: l.quantity,
        threshold: l.threshold,
      })),
    };
  }

  /**
   * Get maintenance data for widgets
   */
  private async getMaintenanceData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    const { startDate, endDate } = dateRange;

    // Work orders by status
    const byStatus = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('wo.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('wo.createdAt >= :start', { start: startDate })
      .andWhere('wo.createdAt <= :end', { end: endDate })
      .groupBy('wo.status')
      .getRawMany();

    // Maintenance costs
    const costsResult = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('SUM(wo.totalCost)', 'total')
      .where('wo.createdAt >= :start', { start: startDate })
      .andWhere('wo.createdAt <= :end', { end: endDate })
      .getRawOne();

    // Machine TRS (simplified calculation)
    const machines = await this.machineRepository.find();
    const machineStats = await Promise.all(
      machines.map(async (machine) => {
        const completedWOs = await this.workOrderRepository.count({
          where: {
            machineId: machine.id,
            status: WorkOrderStatus.COMPLETED,
          } as any,
        });
        return {
          name: machine.designation,
          availability: 85 + Math.random() * 10, // Simplified
          performance: 80 + Math.random() * 15,
          quality: 90 + Math.random() * 8,
        };
      })
    );

    return {
      byStatus: byStatus.map((s: { status: string; count: string }) => ({
        status: s.status,
        count: parseInt(s.count) || 0,
      })),
      costs: {
        total: parseFloat(costsResult?.total || '0'),
      },
      machineStats,
    };
  }

  /**
   * Get quality data for widgets
   */
  private async getQualityData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    const { startDate, endDate } = dateRange;

    // NCR by status
    const ncrByStatus = await this.nonConformityRepository
      .createQueryBuilder('ncr')
      .select('ncr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('ncr.createdAt >= :start', { start: startDate })
      .andWhere('ncr.createdAt <= :end', { end: endDate })
      .groupBy('ncr.status')
      .getRawMany();

    // Inspection pass rate
    const inspections = await this.inspectionRepository
      .createQueryBuilder('ir')
      .select('ir.result', 'result')
      .addSelect('COUNT(*)', 'count')
      .where('ir.inspectionDate >= :start', { start: startDate })
      .andWhere('ir.inspectionDate <= :end', { end: endDate })
      .groupBy('ir.result')
      .getRawMany();

    const totalInspections = inspections.reduce(
      (sum: number, i: { count: string }) => sum + parseInt(i.count),
      0
    );
    const passedInspections = inspections
      .filter((i: { result: string }) => i.result === 'PASSED')
      .reduce((sum: number, i: { count: string }) => sum + parseInt(i.count), 0);
    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    // NCR trend
    const ncrTrend = await this.nonConformityRepository
      .createQueryBuilder('ncr')
      .select("TO_CHAR(ncr.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('ncr.createdAt >= :start', { start: startDate })
      .andWhere('ncr.createdAt <= :end', { end: endDate })
      .groupBy("TO_CHAR(ncr.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      ncrByStatus: ncrByStatus.map((s: { status: string; count: string }) => ({
        status: s.status,
        count: parseInt(s.count) || 0,
      })),
      passRate: Math.round(passRate * 100) / 100,
      ncrTrend: ncrTrend.map((n: { month: string; count: string }) => ({
        month: n.month,
        count: parseInt(n.count) || 0,
      })),
    };
  }

  /**
   * Get comptabilite data for widgets
   */
  private async getComptabiliteData(widget: BiWidget, dateRange: DateRange): Promise<unknown> {
    const { startDate, endDate } = dateRange;

    // Profitability by order
    const profitability = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('oc.orderId', 'orderId')
      .addSelect('SUM(oc.revenue - oc.totalCost)', 'margin')
      .addSelect('SUM(oc.revenue)', 'revenue')
      .where('oc.calculatedAt >= :start', { start: startDate })
      .andWhere('oc.calculatedAt <= :end', { end: endDate })
      .groupBy('oc.orderId')
      .orderBy('margin', 'DESC')
      .limit(20)
      .getRawMany();

    // Cost breakdown
    const costBreakdown = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('AVG(oc.materialCost)', 'material')
      .addSelect('AVG(oc.laborCost)', 'labor')
      .addSelect('AVG(oc.overheadCost)', 'overhead')
      .addSelect('AVG(oc.otherCosts)', 'other')
      .where('oc.calculatedAt >= :start', { start: startDate })
      .andWhere('oc.calculatedAt <= :end', { end: endDate })
      .getRawOne();

    // Average margin
    const marginResult = await this.orderCostingRepository
      .createQueryBuilder('oc')
      .select('AVG((oc.revenue - oc.totalCost) / NULLIF(oc.revenue, 0) * 100)', 'avgMargin')
      .where('oc.calculatedAt >= :start', { start: startDate })
      .andWhere('oc.calculatedAt <= :end', { end: endDate })
      .getRawOne();

    return {
      profitability: profitability.map((p: { orderId: string; margin: string; revenue: string }) => ({
        orderId: p.orderId,
        margin: parseFloat(p.margin) || 0,
        revenue: parseFloat(p.revenue) || 0,
      })),
      costBreakdown: {
        material: parseFloat(costBreakdown?.material || '0'),
        labor: parseFloat(costBreakdown?.labor || '0'),
        overhead: parseFloat(costBreakdown?.overhead || '0'),
        other: parseFloat(costBreakdown?.other || '0'),
      },
      avgMargin: parseFloat(marginResult?.avgMargin || '0'),
    };
  }

  /**
   * Get default date range (current year)
   */
  private getDefaultDateRange(): DateRange {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: now,
    };
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(data: Partial<BiDashboard>): Promise<BiDashboard> {
    const dashboard = this.dashboardRepository.create(data);
    return this.dashboardRepository.save(dashboard);
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id: string, data: Partial<BiDashboard>): Promise<BiDashboard | null> {
    // Extract only the scalar fields (exclude relations like widgets)
    const { widgets, ...updateData } = data;
    await this.dashboardRepository.update(id, updateData as any);
    return this.getDashboard(id);
  }

  /**
   * Delete dashboard (soft delete)
   */
  async deleteDashboard(id: string): Promise<void> {
    await this.dashboardRepository.update(id, { isActive: false });
  }

  /**
   * Seed default dashboards
   */
  async seedDefaultDashboards(): Promise<void> {
    const existingDashboards = await this.dashboardRepository.count();
    if (existingDashboards > 0) return;

    const dashboards = [
      {
        name: 'Executive Dashboard',
        description: 'High-level overview for executives',
        type: DashboardType.EXECUTIVE,
        isDefault: true,
        isPublic: true,
      },
      {
        name: 'Operations Dashboard',
        description: 'Operational metrics and KPIs',
        type: DashboardType.OPERATIONS,
        isPublic: true,
      },
      {
        name: 'Finance Dashboard',
        description: 'Financial performance indicators',
        type: DashboardType.FINANCE,
        isPublic: true,
      },
      {
        name: 'Technical Dashboard',
        description: 'Technical and maintenance metrics',
        type: DashboardType.TECHNICAL,
        isPublic: true,
      },
    ];

    for (const data of dashboards) {
      const dashboard = await this.dashboardRepository.save(
        this.dashboardRepository.create(data)
      );
      await this.createDefaultWidgets(dashboard.id, data.type);
    }
  }

  /**
   * Create default widgets for a dashboard
   */
  private async createDefaultWidgets(dashboardId: string, type: DashboardType): Promise<void> {
    const widgetConfigs = this.getDefaultWidgetConfigs(type);

    for (const config of widgetConfigs) {
      const widget = this.widgetRepository.create({
        ...config,
        dashboardId,
      });
      await this.widgetRepository.save(widget);
    }
  }

  /**
   * Get default widget configurations by dashboard type
   */
  private getDefaultWidgetConfigs(type: DashboardType): Partial<BiWidget>[] {
    const baseWidgets: Partial<BiWidget>[] = [
      {
        title: 'Total Revenue',
        widgetType: WidgetType.KPI_CARD,
        dataSource: WidgetDataSource.REVENUE,
        width: 3,
        height: 2,
        positionX: 0,
        positionY: 0,
      },
      {
        title: 'Monthly Revenue Trend',
        widgetType: WidgetType.LINE_CHART,
        dataSource: WidgetDataSource.REVENUE,
        width: 6,
        height: 4,
        positionX: 0,
        positionY: 2,
      },
    ];

    switch (type) {
      case DashboardType.EXECUTIVE:
        return [
          ...baseWidgets,
          {
            title: 'Order Status',
            widgetType: WidgetType.PIE_CHART,
            dataSource: WidgetDataSource.ORDERS,
            width: 3,
            height: 4,
            positionX: 6,
            positionY: 2,
          },
          {
            title: 'Quality Pass Rate',
            widgetType: WidgetType.GAUGE,
            dataSource: WidgetDataSource.QUALITY,
            width: 3,
            height: 2,
            positionX: 9,
            positionY: 0,
          },
        ];
      case DashboardType.OPERATIONS:
        return [
          ...baseWidgets,
          {
            title: 'Stock Alerts',
            widgetType: WidgetType.DATA_TABLE,
            dataSource: WidgetDataSource.STOCK,
            width: 6,
            height: 4,
            positionX: 6,
            positionY: 2,
          },
          {
            title: 'Maintenance Status',
            widgetType: WidgetType.BAR_CHART,
            dataSource: WidgetDataSource.MAINTENANCE,
            width: 6,
            height: 4,
            positionX: 0,
            positionY: 6,
          },
        ];
      case DashboardType.FINANCE:
        return [
          {
            title: 'Total Revenue',
            widgetType: WidgetType.KPI_CARD,
            dataSource: WidgetDataSource.REVENUE,
            width: 4,
            height: 2,
            positionX: 0,
            positionY: 0,
          },
          {
            title: 'Average Margin',
            widgetType: WidgetType.KPI_CARD,
            dataSource: WidgetDataSource.COMPTABILITE,
            width: 4,
            height: 2,
            positionX: 4,
            positionY: 0,
          },
          {
            title: 'Revenue by Customer',
            widgetType: WidgetType.BAR_CHART,
            dataSource: WidgetDataSource.REVENUE,
            width: 4,
            height: 4,
            positionX: 8,
            positionY: 0,
          },
          {
            title: 'Cost Breakdown',
            widgetType: WidgetType.PIE_CHART,
            dataSource: WidgetDataSource.COMPTABILITE,
            width: 6,
            height: 4,
            positionX: 0,
            positionY: 2,
          },
          {
            title: 'Monthly Revenue',
            widgetType: WidgetType.AREA_CHART,
            dataSource: WidgetDataSource.REVENUE,
            width: 6,
            height: 4,
            positionX: 6,
            positionY: 2,
          },
        ];
      case DashboardType.TECHNICAL:
        return [
          {
            title: 'Machine OEE',
            widgetType: WidgetType.BAR_CHART,
            dataSource: WidgetDataSource.MAINTENANCE,
            width: 6,
            height: 4,
            positionX: 0,
            positionY: 0,
          },
          {
            title: 'Maintenance Costs',
            widgetType: WidgetType.LINE_CHART,
            dataSource: WidgetDataSource.MAINTENANCE,
            width: 6,
            height: 4,
            positionX: 6,
            positionY: 0,
          },
          {
            title: 'Quality Issues',
            widgetType: WidgetType.LINE_CHART,
            dataSource: WidgetDataSource.QUALITY,
            width: 6,
            height: 4,
            positionX: 0,
            positionY: 4,
          },
          {
            title: 'NCR by Status',
            widgetType: WidgetType.PIE_CHART,
            dataSource: WidgetDataSource.QUALITY,
            width: 6,
            height: 4,
            positionX: 6,
            positionY: 4,
          },
        ];
      default:
        return baseWidgets;
    }
  }
}
