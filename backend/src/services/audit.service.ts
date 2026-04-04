import { Repository, Between, FindOptionsWhere, Like } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';
import logger from '../config/logger';

export interface AuditQueryFilters {
  userId?: string;
  action?: string;
  module?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface AuditQueryResult {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// T074: Implement AuditService
export class AuditService {
  private auditLogRepository: Repository<AuditLog>;

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(
    userId: string | null,
    action: string,
    module: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      module,
      details,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      severity,
    });

    const saved = await this.auditLogRepository.save(auditLog);
    logger.debug(`Audit log created: ${action} in ${module}`, { userId, action, module });
    return saved;
  }

  /**
   * Query audit logs with filters and pagination
   * T076: Implement audit log query endpoint
   */
  async queryAuditLogs(
    filters: AuditQueryFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<AuditQueryResult> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.severity) {
      where.severity = filters.severity as 'info' | 'warning' | 'error';
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * Export audit logs to CSV format
   * T077: Add audit log export endpoint (CSV/Excel)
   */
  async exportToCsv(filters: AuditQueryFilters): Promise<string> {
    const { data } = await this.queryAuditLogs(filters, 1, 10000); // Max 10k records

    // CSV Header
    const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Module', 'Severity', 'Details', 'IP Address'];

    // CSV Rows
    const rows = data.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.userId || 'N/A',
      log.user?.email || 'N/A',
      log.action,
      log.module,
      log.severity,
      JSON.stringify(log.details || {}),
      log.ipAddress || 'N/A',
    ]);

    // Escape and format CSV
    const escapeCsv = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Get unique actions for filtering
   */
  async getUniqueActions(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.action', 'action')
      .getRawMany();
    return result.map((r) => r.action);
  }

  /**
   * Get unique modules for filtering
   */
  async getUniqueModules(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.module', 'module')
      .getRawMany();
    return result.map((r) => r.module);
  }

  /**
   * Get audit statistics
   */
  async getStatistics(days: number = 30): Promise<{
    totalLogs: number;
    bySeverity: Record<string, number>;
    byModule: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditLogRepository.find({
      where: {
        createdAt: Between(startDate, new Date()),
      },
    });

    const bySeverity: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    logs.forEach((log) => {
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      bySeverity,
      byModule,
      byAction,
    };
  }

  /**
   * Archive old audit logs (soft delete by moving to archive table - not implemented)
   * For now, this just logs the count of old records
   */
  async archiveOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldLogs = await this.auditLogRepository.find({
      where: {
        createdAt: Between(new Date('2000-01-01'), cutoffDate),
      },
    });

    logger.info(`Found ${oldLogs.length} audit logs older than ${retentionDays} days for archiving`);

    // In a real implementation, you would:
    // 1. Move these to an archive table
    // 2. Or export to file storage
    // 3. Then delete from main table

    return oldLogs.length;
  }
}

export default new AuditService();
