import { Request, Response, NextFunction } from 'express';
import auditService, { AuditQueryFilters } from '../services/audit.service';
import logger from '../config/logger';

// T076: Implement audit log query endpoint
// T077: Add audit log export endpoint (CSV/Excel)
export class AuditController {
  /**
   * Query audit logs with filters and pagination
   */
  queryAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        userId,
        action,
        module,
        severity,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      const filters: AuditQueryFilters = {};

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action as string;
      if (module) filters.module = module as string;
      if (severity) filters.severity = severity as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await auditService.queryAuditLogs(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Query audit logs error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get audit log by ID
   */
  getAuditLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const auditLog = await auditService.getAuditLogById(id);

      if (!auditLog) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit log not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      logger.error('Get audit log error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Export audit logs to CSV
   */
  exportAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, action, module, severity, startDate, endDate } = req.query;

      const filters: AuditQueryFilters = {};

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action as string;
      if (module) filters.module = module as string;
      if (severity) filters.severity = severity as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const csv = await auditService.exportToCsv(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      logger.error('Export audit logs error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get unique actions for filtering
   */
  getUniqueActions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actions = await auditService.getUniqueActions();
      res.status(200).json({
        success: true,
        data: actions,
      });
    } catch (error) {
      logger.error('Get unique actions error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get unique modules for filtering
   */
  getUniqueModules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const modules = await auditService.getUniqueModules();
      res.status(200).json({
        success: true,
        data: modules,
      });
    } catch (error) {
      logger.error('Get unique modules error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get audit statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { days = '30' } = req.query;
      const stats = await auditService.getStatistics(parseInt(days as string, 10));

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get audit statistics error', { error: (error as Error).message });
      next(error);
    }
  };
}

export default new AuditController();
