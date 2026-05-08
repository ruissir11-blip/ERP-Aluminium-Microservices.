import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { Employee, EmployeeStatus } from '../../models/hr/Employee';
import { Department } from '../../models/hr/Department';
import { v4 as uuidv4 } from 'uuid';

export class EmployeeController {
  private employeeRepository = AppDataSource.getRepository(Employee);
  private departmentRepository = AppDataSource.getRepository(Department);

  /**
   * List all employees with pagination and filters
   */
  listEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        search = '',
        status,
        departmentId,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.employeeRepository.createQueryBuilder('employee')
        .leftJoinAndSelect('employee.department', 'department')
        .orderBy(`employee.${sortBy as string}`, sortOrder as 'ASC' | 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search OR employee.employeeNumber ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere('employee.status = :status', { status });
      }

      if (departmentId) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', { departmentId });
      }

      const [employees, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: {
          employees,
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
   * Get employee by ID
   */
  getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const employee = await this.employeeRepository.findOne({
        where: { id },
        relations: ['department'],
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new employee
   */
  createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        address,
        city,
        postalCode,
        country,
        emergencyContact,
        emergencyPhone,
        nationalId,
        bankAccount,
        socialSecurityNumber,
        departmentId,
        hireDate,
        status = 'ACTIVE',
      } = req.body;

      // Robust employee number generation (EMP-YYYY-XXXX)
      const year = new Date().getFullYear();
      const lastEmployee = await this.employeeRepository.findOne({
        where: {},
        order: { employeeNumber: 'DESC' }
      });
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeNumber.startsWith(`EMP-${year}`)) {
        const parts = lastEmployee.employeeNumber.split('-');
        if (parts.length === 3) {
          nextNumber = parseInt(parts[2]) + 1;
        }
      } else {
        // If no employee for this year or number format changed, use count as fallback
        const count = await this.employeeRepository.count();
        nextNumber = count + 1;
      }
      
      const employeeNumber = `EMP-${year}-${String(nextNumber).padStart(4, '0')}`;

      // Check if email already exists
      const emailExists = await this.employeeRepository.findOne({ where: { email } });
      if (emailExists) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_EMAIL', message: 'An employee with this email already exists' },
        });
        return;
      }

      // Check if department exists
      let department = null;
      if (departmentId) {
        department = await this.departmentRepository.findOne({ where: { id: departmentId } });
        if (!department) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_DEPARTMENT', message: 'Department not found' },
          });
          return;
        }
      }

      const employee = this.employeeRepository.create({
        employeeNumber,
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        address,
        city,
        postalCode,
        country: country || 'France',
        emergencyContact,
        emergencyPhone,
        nationalId,
        bankAccount,
        socialSecurityNumber,
        departmentId,
        department,
        hireDate,
        status: status as EmployeeStatus,
        isActive: true,
      });

      await this.employeeRepository.save(employee);

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an employee
   */
  updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const employee = await this.employeeRepository.findOne({ where: { id } });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      // Update department if provided
      if (updateData.departmentId && updateData.departmentId !== employee.departmentId) {
        const department = await this.departmentRepository.findOne({ 
          where: { id: updateData.departmentId } 
        });
        if (!department) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_DEPARTMENT', message: 'Department not found' },
          });
          return;
        }
        employee.department = department;
        employee.departmentId = department.id;
      }

      // Apply updates
      Object.assign(employee, updateData);
      await this.employeeRepository.save(employee);

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Archive (soft delete) an employee
   */
  archiveEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const employee = await this.employeeRepository.findOne({ where: { id } });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      employee.isActive = false;
      employee.status = EmployeeStatus.TERMINATED;
      employee.terminationDate = new Date();
      
      await this.employeeRepository.save(employee);

      res.status(200).json({
        success: true,
        message: 'Employee archived successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get employee statistics for dashboard
   */
  getEmployeeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const total = await this.employeeRepository.count({ where: { isActive: true } });
      const byStatus = await this.employeeRepository
        .createQueryBuilder('employee')
        .select('employee.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('employee.isActive = :isActive', { isActive: true })
        .groupBy('employee.status')
        .getRawMany();

      const byDepartment = await this.employeeRepository
        .createQueryBuilder('employee')
        .leftJoin('employee.department', 'department')
.select("COALESCE(department.name, 'Unassigned')", 'department')
        .addSelect('COUNT(*)', 'count')
        .where('employee.isActive = :isActive', { isActive: true })
        .groupBy('department.name')
        .getRawMany();

      res.status(200).json({
        success: true,
        data: {
          total,
          byStatus,
          byDepartment,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const employeeController = new EmployeeController();

