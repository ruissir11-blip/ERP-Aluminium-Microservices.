import { Request, Response } from 'express';
import { DashboardService, DateRange } from '../../services/bi/DashboardService';
import { BiDashboard } from '../../models/bi/Dashboard';

export class BIDashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get all dashboards
   */
  async getDashboards(req: Request, res: Response): Promise<void> {
    try {
      const dashboards = await this.dashboardService.getDashboards();
      res.json({
        success: true,
        data: dashboards,
      });
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboards',
      });
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dashboard = await this.dashboardService.getDashboard(id);

      if (!dashboard) {
        res.status(404).json({
          success: false,
          message: 'Dashboard not found',
        });
        return;
      }

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard',
      });
    }
  }

  /**
   * Get dashboard with widget data
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      let dateRange: DateRange | undefined;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        };
      }

      const dashboardData = await this.dashboardService.getDashboardData(id, dateRange);

      if (!dashboardData) {
        res.status(404).json({
          success: false,
          message: 'Dashboard not found',
        });
        return;
      }

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
      });
    }
  }

  /**
   * Create new dashboard
   */
  async createDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData: Partial<BiDashboard> = req.body;
      const dashboard = await this.dashboardService.createDashboard(dashboardData);

      res.status(201).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating dashboard',
      });
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const dashboard = await this.dashboardService.updateDashboard(id, updates);

      if (!dashboard) {
        res.status(404).json({
          success: false,
          message: 'Dashboard not found',
        });
        return;
      }

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error('Error updating dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating dashboard',
      });
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.dashboardService.deleteDashboard(id);

      res.json({
        success: true,
        message: 'Dashboard deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting dashboard',
      });
    }
  }

  /**
   * Seed default dashboards
   */
  async seedDashboards(req: Request, res: Response): Promise<void> {
    try {
      await this.dashboardService.seedDefaultDashboards();

      res.json({
        success: true,
        message: 'Default dashboards created successfully',
      });
    } catch (error) {
      console.error('Error seeding dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Error seeding dashboards',
      });
    }
  }
}

export const biDashboardController = new BIDashboardController();
