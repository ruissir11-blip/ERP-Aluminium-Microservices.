import { Request, Response } from 'express';
import { qualityReportService } from '../../services/quality/QualityReportService';

/**
 * QualityReportController
 * Handles report generation and certificate of conformity endpoints
 */
export class QualityReportController {
  /**
   * GET /api/v1/quality/reports/weekly
   * Generate weekly quality report
   */
  async getWeeklyReport(req: Request, res: Response): Promise<void> {
    try {
      const { weekStart } = req.query;

      if (!weekStart) {
        res.status(400).json({
          success: false,
          message: 'weekStart parameter is required',
        });
        return;
      }

      const startDate = new Date(weekStart as string);
      const report = await qualityReportService.generateWeeklyReport(startDate);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating weekly report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/quality/reports/monthly
   * Generate monthly quality report
   */
  async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        res.status(400).json({
          success: false,
          message: 'month and year parameters are required',
        });
        return;
      }

      const monthNum = parseInt(month as string, 10);
      const yearNum = parseInt(year as string, 10);

      if (monthNum < 1 || monthNum > 12) {
        res.status(400).json({
          success: false,
          message: 'month must be between 1 and 12',
        });
        return;
      }

      const report = await qualityReportService.generateMonthlyReport(monthNum, yearNum);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating monthly report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/quality/certificates/generate
   * Generate certificate of conformity for an order
   */
  async generateCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'orderId is required',
        });
        return;
      }

      const certificate = await qualityReportService.generateCertificate(orderId);

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'No inspections found for this order',
        });
        return;
      }

      res.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating certificate',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/quality/reports/send-weekly
   * Send weekly report via email
   */
  async sendWeeklyReport(req: Request, res: Response): Promise<void> {
    try {
      const { weekStart, recipients } = req.body;

      if (!weekStart || !recipients || !Array.isArray(recipients)) {
        res.status(400).json({
          success: false,
          message: 'weekStart and recipients array are required',
        });
        return;
      }

      const startDate = new Date(weekStart);
      const report = await qualityReportService.generateWeeklyReport(startDate);
      const sent = await qualityReportService.sendScheduledReport('weekly', report, recipients);

      res.json({
        success: sent,
        message: sent ? 'Report sent successfully' : 'Failed to send report',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending weekly report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/quality/reports/send-monthly
   * Send monthly report via email
   */
  async sendMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const { month, year, recipients } = req.body;

      if (!month || !year || !recipients || !Array.isArray(recipients)) {
        res.status(400).json({
          success: false,
          message: 'month, year, and recipients array are required',
        });
        return;
      }

      const monthNum = parseInt(month as string, 10);
      const yearNum = parseInt(year as string, 10);
      const report = await qualityReportService.generateMonthlyReport(monthNum, yearNum);
      const sent = await qualityReportService.sendScheduledReport('monthly', report, recipients);

      res.json({
        success: sent,
        message: sent ? 'Report sent successfully' : 'Failed to send report',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending monthly report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const qualityReportController = new QualityReportController();
