import { Request, Response } from 'express';
import { dataSource } from '../../config/database';
import { Employee } from '../../models/hr/Employee';
import { EmployeeContract } from '../../models/hr/EmployeeContract';
import { Attendance } from '../../models/hr/Attendance';
import { LeaveRequest } from '../../models/hr/LeaveRequest';
import { Payslip, PayslipStatus } from '../../models/hr/Payslip';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

class PayslipController {
  // List all payslips with filters
  async listPayslips(req: Request, res: Response) {
    try {
      const { employeeId, status, periodMonth, periodYear, page = 1, limit = 20 } = req.query;
      
      const where: any = {};
      if (employeeId) where.employeeId = String(employeeId);
      if (status) where.status = status;
      if (periodMonth) where.periodMonth = Number(periodMonth);
      if (periodYear) where.periodYear = Number(periodYear);

      const [payslips, total] = await dataSource.getRepository(Payslip).findAndCount({
        where,
        relations: ['employee'],
        order: { periodYear: 'DESC', periodMonth: 'DESC' },
        skip: ((Number(page) - 1) * Number(limit)),
        take: Number(limit),
      });

      res.json({
        success: true,
        data: { payslips, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (error) {
      console.error('Error listing payslips:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la liste des bulletins de paie' });
    }
  }

  // Get payslip by ID
  async getPayslipById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payslip = await dataSource.getRepository(Payslip).findOne({
        where: { id },
        relations: ['employee'],
      });

      if (!payslip) {
        return res.status(404).json({ success: false, message: 'Bulletin de paie non trouvé' });
      }

      res.json({ success: true, data: payslip });
    } catch (error) {
      console.error('Error getting payslip:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du bulletin' });
    }
  }

  // Generate payslip for employee for a specific month/year
  async generatePayslip(req: Request, res: Response) {
    try {
      const { employeeId, periodMonth, periodYear } = req.body;

      // Validate inputs
      if (!employeeId || !periodMonth || !periodYear) {
        return res.status(400).json({ success: false, message: 'Paramètres manquants' });
      }

      // Get employee and contract
      const employee = await dataSource.getRepository(Employee).findOne({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employé non trouvé' });
      }

      // Get active contract
      const contract = await dataSource.getRepository(EmployeeContract).findOne({
        where: { employeeId, status: 'ACTIVE' },
        order: { startDate: 'DESC' },
      });

      if (!contract) {
        return res.status(404).json({ success: false, message: 'Contrat actif non trouvé' });
      }

      // Get attendances for the period
      const startDate = new Date(Number(periodYear), Number(periodMonth) - 1, 1);
      const endDate = new Date(Number(periodYear), Number(periodMonth), 0);

      const attendances = await dataSource.getRepository(Attendance).find({
        where: {
          employeeId,
          attendanceDate: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
        },
      });

      // Calculate work hours
      let totalWorkHours = 0;
      let totalOvertimeHours = 0;
      for (const att of attendances) {
        if (att.workHours) totalWorkHours += att.workHours;
        if (att.overtimeHours) totalOvertimeHours += att.overtimeHours;
      }

      // Get approved leave days for the period
      const leaveRequests = await dataSource.getRepository(LeaveRequest).find({
        where: {
          employeeId,
          status: 'APPROVED',
          startDate: LessThanOrEqual(endDate.toISOString().split('T')[0]),
          endDate: MoreThanOrEqual(startDate.toISOString().split('T')[0]),
        },
      });

      const unpaidLeaveDays = leaveRequests
        .filter(lr => lr.leaveType === 'UNPAID')
        .reduce((sum, lr) => sum + lr.totalDays, 0);

      // Calculate salary
      const baseSalary = Number(contract.baseSalary);
      
      // Overtime pay (1.25x normal rate for hours beyond 35h/week)
      const hourlyRate = baseSalary / (contract.weeklyHours * 4.33); // ~4.33 weeks per month
      const overtimePay = totalOvertimeHours * hourlyRate * 1.25;

      // Bonuses (can be customized)
      const bonuses = 0;

      // Deductions
      // - Unpaid leave deduction
      const dailyRate = baseSalary / 20; // Assuming 20 working days per month
      const unpaidDeduction = unpaidLeaveDays * dailyRate;
      
      // - Social security contributions (~22% employee share)
      const socialDeductions = (baseSalary + overtimePay + bonuses - unpaidDeduction) * 0.22;
      
      // - Income tax (~0-30% depending on salary, simplified calculation)
      const taxableIncome = baseSalary + overtimePay + bonuses - unpaidDeduction;
      let taxRate = 0;
      if (taxableIncome > 5000) taxRate = 0.30;
      else if (taxableIncome > 3000) taxRate = 0.20;
      else if (taxableIncome > 1500) taxRate = 0.10;
      const incomeTax = taxableIncome * taxRate;

      const deductions = socialDeductions + incomeTax + unpaidDeduction;
      const netSalary = (baseSalary + overtimePay + bonuses) - deductions;

      // Create or update payslip
      const existingPayslip = await dataSource.getRepository(Payslip).findOne({
        where: { employeeId, periodMonth: Number(periodMonth), periodYear: Number(periodYear) },
      });

      let payslip: Payslip;
      if (existingPayslip) {
        // Update existing
        existingPayslip.baseSalary = baseSalary;
        existingPayslip.overtimePay = overtimePay;
        existingPayslip.bonuses = bonuses;
        existingPayslip.deductions = deductions;
        existingPayslip.netSalary = netSalary;
        payslip = await dataSource.getRepository(Payslip).save(existingPayslip);
      } else {
        // Create new
        const newPayslip = dataSource.getRepository(Payslip).create({
          employeeId,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
          baseSalary,
          overtimePay,
          bonuses,
          deductions,
          netSalary,
          status: PayslipStatus.DRAFT,
        });
        payslip = await dataSource.getRepository(Payslip).save(newPayslip);
      }

      res.json({ success: true, data: payslip });
    } catch (error) {
      console.error('Error generating payslip:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la génération du bulletin' });
    }
  }

  // Validate payslip
  async validatePayslip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const payslip = await dataSource.getRepository(Payslip).findOne({
        where: { id },
      });

      if (!payslip) {
        return res.status(404).json({ success: false, message: 'Bulletin de paie non trouvé' });
      }

      payslip.status = PayslipStatus.VALIDATED;
      await dataSource.getRepository(Payslip).save(payslip);

      res.json({ success: true, data: payslip });
    } catch (error) {
      console.error('Error validating payslip:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la validation' });
    }
  }

  // Mark payslip as paid
  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const payslip = await dataSource.getRepository(Payslip).findOne({
        where: { id },
      });

      if (!payslip) {
        return res.status(404).json({ success: false, message: 'Bulletin de paie non trouvé' });
      }

      payslip.status = PayslipStatus.PAID;
      await dataSource.getRepository(Payslip).save(payslip);

      res.json({ success: true, data: payslip });
    } catch (error) {
      console.error('Error marking payslip as paid:', error);
      res.status(500).json({ success: false, message: 'Erreur lors du marquage comme payé' });
    }
  }

  // Generate batch payslips for all employees for a period
  async generateBatchPayslips(req: Request, res: Response) {
    try {
      const { periodMonth, periodYear } = req.body;

      if (!periodMonth || !periodYear) {
        return res.status(400).json({ success: false, message: 'Paramètres manquants' });
      }

      // Get all active employees
      const employees = await dataSource.getRepository(Employee).find({
        where: { status: 'ACTIVE' },
      });

      const results = [];
      for (const employee of employees) {
        try {
          // Get active contract
          const contract = await dataSource.getRepository(EmployeeContract).findOne({
            where: { employeeId: employee.id, status: 'ACTIVE' },
          });

          if (!contract) continue;

          // Calculate similar to generatePayslip
          const startDate = new Date(Number(periodYear), Number(periodMonth) - 1, 1);
          const endDate = new Date(Number(periodYear), Number(periodMonth), 0);

          const attendances = await dataSource.getRepository(Attendance).find({
            where: {
              employeeId: employee.id,
              attendanceDate: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
          });

          let totalWorkHours = 0;
          let totalOvertimeHours = 0;
          for (const att of attendances) {
            if (att.workHours) totalWorkHours += att.workHours;
            if (att.overtimeHours) totalOvertimeHours += att.overtimeHours;
          }

          const baseSalary = Number(contract.baseSalary);
          const hourlyRate = baseSalary / (contract.weeklyHours * 4.33);
          const overtimePay = totalOvertimeHours * hourlyRate * 1.25;
          const bonuses = 0;

          const socialDeductions = (baseSalary + overtimePay) * 0.22;
          const taxableIncome = baseSalary + overtimePay;
          let taxRate = 0;
          if (taxableIncome > 5000) taxRate = 0.30;
          else if (taxableIncome > 3000) taxRate = 0.20;
          else if (taxableIncome > 1500) taxRate = 0.10;
          const incomeTax = taxableIncome * taxRate;

          const deductions = socialDeductions + incomeTax;
          const netSalary = (baseSalary + overtimePay + bonuses) - deductions;

          // Check if exists
          const existing = await dataSource.getRepository(Payslip).findOne({
            where: { employeeId: employee.id, periodMonth: Number(periodMonth), periodYear: Number(periodYear) },
          });

          if (existing) {
            existing.baseSalary = baseSalary;
            existing.overtimePay = overtimePay;
            existing.bonuses = bonuses;
            existing.deductions = deductions;
            existing.netSalary = netSalary;
            await dataSource.getRepository(Payslip).save(existing);
            results.push({ employeeId: employee.id, status: 'updated' });
          } else {
            const newPayslip = dataSource.getRepository(Payslip).create({
              employeeId: employee.id,
              periodMonth: Number(periodMonth),
              periodYear: Number(periodYear),
              baseSalary,
              overtimePay,
              bonuses,
              deductions,
              netSalary,
              status: PayslipStatus.DRAFT,
            });
            await dataSource.getRepository(Payslip).save(newPayslip);
            results.push({ employeeId: employee.id, status: 'created' });
          }
        } catch (empError) {
          results.push({ employeeId: employee.id, status: 'error', message: String(empError) });
        }
      }

      res.json({ success: true, data: { total: employees.length, results } });
    } catch (error) {
      console.error('Error generating batch payslips:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la génération batch' });
    }
  }
}

export const payslipController = new PayslipController();
