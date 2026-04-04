import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { StockAlert } from '../../models/stock/StockAlert';
import { InventoryItem } from '../../models/stock/InventoryItem';
import { sendEmail } from '../../config/email';

export interface CreateStockAlertInput {
  profileId: string;
  warehouseId?: string;
  minimumThreshold: number;
  maximumThreshold?: number;
  reorderPoint?: number;
  emailRecipients?: string[];
}

export interface UpdateStockAlertInput extends Partial<CreateStockAlertInput> {
  isActive?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export class StockAlertService {
  private alertRepository: Repository<StockAlert>;
  private itemRepository: Repository<InventoryItem>;

  constructor() {
    this.alertRepository = AppDataSource.getRepository(StockAlert);
    this.itemRepository = AppDataSource.getRepository(InventoryItem);
  }

  /**
   * Get all stock alerts with optional filtering
   */
  async findAll(isActive?: boolean, isTriggered?: boolean): Promise<StockAlert[]> {
    const query = this.alertRepository.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.profile', 'profile')
      .leftJoinAndSelect('alert.warehouse', 'warehouse');

    if (isActive !== undefined) {
      query.andWhere('alert.isActive = :isActive', { isActive });
    }

    if (isTriggered !== undefined) {
      query.andWhere('alert.isTriggered = :isTriggered', { isTriggered });
    }

    return query.orderBy('alert.createdAt', 'DESC').getMany();
  }

  /**
   * Get stock alert by ID
   */
  async findById(id: string): Promise<StockAlert | null> {
    return this.alertRepository.findOne({
      where: { id },
      relations: ['profile', 'warehouse'],
    });
  }

  /**
   * Find alerts for a specific profile and warehouse
   */
  async findByProfileAndWarehouse(profileId: string, warehouseId?: string): Promise<StockAlert[]> {
    const query = this.alertRepository.createQueryBuilder('alert')
      .where('alert.profileId = :profileId', { profileId });

    if (warehouseId) {
      query.andWhere('alert.warehouseId = :warehouseId', { warehouseId });
    } else {
      query.andWhere('alert.warehouseId IS NULL');
    }

    return query.getMany();
  }

  /**
   * Create new stock alert
   */
  async create(input: CreateStockAlertInput): Promise<StockAlert> {
    const alert = this.alertRepository.create({
      ...input,
      isActive: true,
      isTriggered: false,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Update existing stock alert
   */
  async update(id: string, input: UpdateStockAlertInput): Promise<StockAlert> {
    const alert = await this.findById(id);
    if (!alert) {
      throw new Error('Stock alert not found');
    }

    Object.assign(alert, input);
    return this.alertRepository.save(alert);
  }

  /**
   * Deactivate stock alert
   */
  async deactivate(id: string): Promise<void> {
    const alert = await this.findById(id);
    if (!alert) {
      throw new Error('Stock alert not found');
    }

    alert.isActive = false;
    await this.alertRepository.save(alert);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledge(id: string, userId: string): Promise<StockAlert> {
    const alert = await this.findById(id);
    if (!alert) {
      throw new Error('Stock alert not found');
    }

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.isTriggered = false;

    return this.alertRepository.save(alert);
  }

  /**
   * Check and trigger alerts based on current inventory
   */
  async checkAlerts(): Promise<StockAlert[]> {
    // Get all active alerts
    const alerts = await this.findAll(true, false);

    const triggeredAlerts: StockAlert[] = [];

    for (const alert of alerts) {
      // Get inventory items for this profile
      const items = await this.itemRepository.find({
        where: { profileId: alert.profileId },
        relations: ['warehouse'],
      });

      for (const item of items) {
        // Check if warehouse matches (or alert is global)
        if (alert.warehouseId && item.warehouseId !== alert.warehouseId) {
          continue;
        }

        const quantity = Number(item.quantityOnHand);

        // Check minimum threshold
        if (alert.minimumThreshold && quantity <= alert.minimumThreshold) {
          alert.isTriggered = true;
          alert.lastTriggeredAt = new Date();
          await this.alertRepository.save(alert);
          triggeredAlerts.push(alert);

          // Send email notification
          if (alert.emailRecipients && alert.emailRecipients.length > 0) {
            await this.sendAlertEmail(alert, item);
          }
          break;
        }

        // Check maximum threshold
        if (alert.maximumThreshold && quantity >= alert.maximumThreshold) {
          alert.isTriggered = true;
          alert.lastTriggeredAt = new Date();
          await this.alertRepository.save(alert);
          triggeredAlerts.push(alert);

          // Send email notification
          if (alert.emailRecipients && alert.emailRecipients.length > 0) {
            await this.sendAlertEmail(alert, item);
          }
          break;
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get all triggered (active) alerts
   */
  async getActiveAlerts(): Promise<StockAlert[]> {
    return this.findAll(undefined, true);
  }

  /**
   * Send alert email notification
   */
  private async sendAlertEmail(alert: StockAlert, item: InventoryItem): Promise<void> {
    if (!alert.emailRecipients || alert.emailRecipients.length === 0) {
      return;
    }

    const subject = alert.minimumThreshold 
      ? `⚠️ Low Stock Alert: ${item.profile?.reference || 'Product'}`
      : `⚠️ Overstock Alert: ${item.profile?.reference || 'Product'}`;

    const body = alert.minimumThreshold
      ? `The following item is below the minimum threshold:\n\n` +
        `Product: ${item.profile?.reference} - ${item.profile?.name}\n` +
        `Warehouse: ${item.warehouse?.name}\n` +
        `Current Quantity: ${item.quantityOnHand}\n` +
        `Minimum Threshold: ${alert.minimumThreshold}\n` +
        `Reorder Point: ${alert.reorderPoint || 'Not set'}\n`
      : `The following item is above the maximum threshold:\n\n` +
        `Product: ${item.profile?.reference} - ${item.profile?.name}\n` +
        `Warehouse: ${item.warehouse?.name}\n` +
        `Current Quantity: ${item.quantityOnHand}\n` +
        `Maximum Threshold: ${alert.maximumThreshold}\n`;

    try {
      await sendEmail({
        to: alert.emailRecipients,
        subject,
        text: body,
      });
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
  }
}
