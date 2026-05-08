import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { Payslip } from '../../models/hr/Payslip';
import { Employee } from '../../models/hr/Employee';
import { EmployeeContract } from '../../models/hr/EmployeeContract';

export class PayslipController {
  private payslipRepository = AppDataSource.getRepository(Payslip);
  private employeeRepository = AppDataSource.getRepository(Employee);
  private contractRepository = AppDataSource.getRepository(EmployeeContract);

  /**
   * List payslips with filters
   */
  listPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, year, month, status, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.payslipRepository.createQueryBuilder('payslip')
        .leftJoinAndSelect('payslip.employee', 'employee')
        .orderBy('payslip.payslipDate', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (employeeId) {
        queryBuilder.andWhere('payslip.employeeId = :employeeId', { employeeId });
      }

      if (year) {
        queryBuilder.andWhere('EXTRACT(YEAR FROM payslip.payslipDate) = :year', { year });
      }

      if (month) {
        queryBuilder.andWhere('EXTRACT(MONTH FROM payslip.payslipDate) = :month', { month });
      }

      if (status) {
        queryBuilder.andWhere('payslip.status = :status', { status });
      }

      const [payslips, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: {
          payslips,
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
   * Get payslip by ID
   */
  getPayslipById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const payslip = await this.payslipRepository.findOne({
        where: { id },
        relations: ['employee'],
      });

      if (!payslip) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payslip not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payslip,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate payslip for employee
   */
  generatePayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, payslipDate, month, year } = req.body;

      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId },
        relations: ['contracts'],
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      const activeContract = employee.contracts?.find(c => c.status === 'ACTIVE');
      if (!activeContract) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_ACTIVE_CONTRACT', message: 'No active contract found for employee' },
        });
        return;
      }

      // Calculate payslip values (simplified)
      const baseSalary = activeContract.baseSalary || 0;
      const workDays = 22; // Standard work days per month
      const grossSalary = (baseSalary / workDays) * 20; // Assume 20 working days
      const socialContributions = grossSalary * 0.25; // 25% contributions
      const netSalary = grossSalary - socialContributions;

      const payslip = this.payslipRepository.create({
        employeeId,
        employee,
        payslipDate,
        periodMonth: Number(month),
        periodYear: Number(year),
        baseSalary: baseSalary,
        overtimePay: 0,
        bonuses: 0,
        deductions: socialContributions,
        netSalary,
        status: 'DRAFT',
        pdfUrl: '', // Will be generated later
      });

      await this.payslipRepository.save(payslip);

      res.status(201).json({
        success: true,
        data: payslip,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate batch payslips for all active employees
   */
  generateBatchPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, year } = req.body;
      const payslipDate = new Date(year, month - 1, 1);

      const activeEmployees = await this.employeeRepository.find({
        where: { isActive: true, status: 'ACTIVE' },
        relations: ['contracts'],
      });

      const generatedPayslips = [];

      for (const employee of activeEmployees) {
        const activeContract = employee.contracts?.find(c => c.status === 'ACTIVE');
        if (activeContract) {
          // Reuse generatePayslip logic
          const baseSalary = activeContract.baseSalary || 0;
          const grossSalary = (baseSalary / 22) * 20;
          const socialContributions = grossSalary * 0.25;
          const netSalary = grossSalary - socialContributions;

          const payslip = this.payslipRepository.create({
            employeeId: employee.id,
            employee,
            payslipDate,
            periodMonth: Number(month),
            periodYear: Number(year),
            baseSalary: baseSalary,
            overtimePay: 0,
            bonuses: 0,
            deductions: socialContributions,
            netSalary,
            status: 'DRAFT',
            pdfUrl: '',
          });

          await this.payslipRepository.save(payslip);
          generatedPayslips.push(payslip);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          generatedCount: generatedPayslips.length,
          payslips: generatedPayslips,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate payslip
   */
  validatePayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const payslip = await this.payslipRepository.findOne({ where: { id } });

      if (!payslip) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payslip not found' },
        });
        return;
      }

      if (payslip.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only validate draft payslips' },
        });
        return;
      }

      payslip.status = 'VALIDATED';
      payslip.validatedAt = new Date();

      await this.payslipRepository.save(payslip);

      res.status(200).json({
        success: true,
        data: payslip,
        message: 'Payslip validated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark payslip as paid
   */
  markAsPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const payslip = await this.payslipRepository.findOne({ where: { id } });

      if (!payslip) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payslip not found' },
        });
        return;
      }

      if (payslip.status !== 'VALIDATED') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only mark validated payslips as paid' },
        });
        return;
      }

      payslip.status = 'PAID';
      payslip.paidAt = new Date();
      payslip.paymentReference = `PAY-${Date.now()}`;

      await this.payslipRepository.save(payslip);

      res.status(200).json({
        success: true,
        data: payslip,
        message: 'Payslip marked as paid',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const payslipController = new PayslipController();
