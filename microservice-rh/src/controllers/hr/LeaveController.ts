import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { LeaveRequest, LeaveStatus } from '../../models/hr/LeaveRequest';
import { Employee } from '../../models/hr/Employee';

export class LeaveController {
  private leaveRepository = AppDataSource.getRepository(LeaveRequest);
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * List leave requests with filters
   */
  listLeaveRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status,
        employeeId,
        leaveType,
        startDate,
        endDate,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.leaveRepository.createQueryBuilder('leave')
        .leftJoinAndSelect('leave.employee', 'employee')
        .leftJoinAndSelect('leave.approver', 'approver')
        .orderBy('leave.createdAt', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (status) {
        queryBuilder.andWhere('leave.status = :status', { status });
      }

      if (employeeId) {
        queryBuilder.andWhere('leave.employeeId = :employeeId', { employeeId });
      }

      if (leaveType) {
        queryBuilder.andWhere('leave.leaveType = :leaveType', { leaveType });
      }

      if (startDate) {
        queryBuilder.andWhere('leave.startDate >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('leave.endDate <= :endDate', { endDate });
      }

      const [requests, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: {
          requests,
          total,
          page: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get leave request by ID
   */
  getLeaveRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const request = await this.leaveRepository.findOne({
        where: { id },
        relations: ['employee', 'approver'],
      });

      if (!request) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new leave request
   */
  createLeaveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, leaveType, startDate, endDate, reason } = req.body;
      const currentUserId = (req as any).user?.id;

      // Validate employee exists
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMPLOYEE', message: 'Employee not found' },
        });
        return;
      }

      // Calculate total days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const leaveRequest = this.leaveRepository.create({
        employeeId,
        employee,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: LeaveStatus.PENDING,
      });

      await this.leaveRepository.save(leaveRequest);

      res.status(201).json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a leave request (only if pending)
   */
  updateLeaveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const request = await this.leaveRepository.findOne({ where: { id } });

      if (!request) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        });
        return;
      }

      if (request.status !== LeaveStatus.PENDING) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only update pending requests' },
        });
        return;
      }

      // Recalculate days if dates changed
      if (updateData.startDate || updateData.endDate) {
        const start = new Date(updateData.startDate || request.startDate);
        const end = new Date(updateData.endDate || request.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        updateData.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }

      Object.assign(request, updateData);
      await this.leaveRepository.save(request);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve a leave request
   */
  approveLeaveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const approverId = (req as any).user?.id;

      const request = await this.leaveRepository.findOne({ 
        where: { id },
        relations: ['employee'],
      });

      if (!request) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        });
        return;
      }

      if (request.status !== LeaveStatus.PENDING) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only approve pending requests' },
        });
        return;
      }

      request.status = LeaveStatus.APPROVED;
      request.approverId = approverId;
      request.approvedAt = new Date();

      await this.leaveRepository.save(request);

      res.status(200).json({
        success: true,
        data: request,
        message: 'Leave request approved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject a leave request
   */
  rejectLeaveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const approverId = (req as any).user?.id;

      const request = await this.leaveRepository.findOne({ where: { id } });

      if (!request) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        });
        return;
      }

      if (request.status !== LeaveStatus.PENDING) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only reject pending requests' },
        });
        return;
      }

      request.status = LeaveStatus.REJECTED;
      request.approverId = approverId;
      request.approvedAt = new Date();
      request.rejectionReason = rejectionReason;

      await this.leaveRepository.save(request);

      res.status(200).json({
        success: true,
        data: request,
        message: 'Leave request rejected',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel own leave request
   */
  cancelLeaveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;

      const request = await this.leaveRepository.findOne({ where: { id } });

      if (!request) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Leave request not found' },
        });
        return;
      }

      if (request.employeeId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Can only cancel your own requests' },
        });
        return;
      }

      if (request.status !== LeaveStatus.PENDING) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only cancel pending requests' },
        });
        return;
      }

      request.status = LeaveStatus.CANCELLED;
      await this.leaveRepository.save(request);

      res.status(200).json({
        success: true,
        message: 'Leave request cancelled',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get leave balance for an employee
   */
  getLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      // Get approved annual leave for the year
      const approvedLeaves = await this.leaveRepository
        .createQueryBuilder('leave')
        .where('leave.employeeId = :employeeId', { employeeId })
        .andWhere('leave.leaveType = :leaveType', { leaveType: 'ANNUAL' })
        .andWhere('leave.status = :status', { status: 'APPROVED' })
        .andWhere('EXTRACT(YEAR FROM leave.startDate) = :year', { year })
        .getMany();

      const usedDays = approvedLeaves.reduce((sum, l) => sum + Number(l.totalDays), 0);
      const annualAllowance = 25; // Default French allowance

      res.status(200).json({
        success: true,
        data: {
          employeeId,
          year,
          annualAllowance,
          usedDays,
          remainingDays: annualAllowance - usedDays,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const leaveController = new LeaveController();
