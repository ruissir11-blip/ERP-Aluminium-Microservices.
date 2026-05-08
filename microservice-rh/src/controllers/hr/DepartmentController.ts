import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { Department } from '../../models/hr/Department';
import { Employee } from '../../models/hr/Employee';

export class DepartmentController {
  private departmentRepository = AppDataSource.getRepository(Department);
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * List all departments
   */
  listDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search = '', includeInactive = 'false' } = req.query;

      const queryBuilder = this.departmentRepository.createQueryBuilder('department')
        .leftJoinAndSelect('department.manager', 'manager')
        .leftJoinAndSelect('department.parentDepartment', 'parent')
        .orderBy('department.name', 'ASC');

      if (search) {
        queryBuilder.andWhere(
          '(department.name ILIKE :search OR department.code ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (includeInactive !== 'true') {
        queryBuilder.andWhere('department.isActive = :isActive', { isActive: true });
      }

      const departments = await queryBuilder.getMany();

      // Get employee count per department
      const departmentsWithCount = await Promise.all(
        departments.map(async (dept) => {
          const employeeCount = await this.employeeRepository.count({
            where: { departmentId: dept.id, isActive: true },
          });
          return { ...dept, employeeCount };
        })
      );

      res.status(200).json({
        success: true,
        data: departmentsWithCount,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get department by ID
   */
  getDepartmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const department = await this.departmentRepository.findOne({
        where: { id },
        relations: ['manager', 'parentDepartment', 'employees'],
      });

      if (!department) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Department not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new department
   */
  createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, name, description, managerId, parentDepartmentId } = req.body;

      // Check for duplicate code
      const existing = await this.departmentRepository.findOne({ where: { code } });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'Department code already exists' },
        });
        return;
      }

      // Validate manager if provided
      let manager = null;
      if (managerId) {
        manager = await this.employeeRepository.findOne({ where: { id: managerId } });
        if (!manager) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_MANAGER', message: 'Manager employee not found' },
          });
          return;
        }
      }

      // Validate parent department if provided
      let parentDepartment = null;
      if (parentDepartmentId) {
        parentDepartment = await this.departmentRepository.findOne({ 
          where: { id: parentDepartmentId } 
        });
        if (!parentDepartment) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_PARENT', message: 'Parent department not found' },
          });
          return;
        }
      }

      const department = this.departmentRepository.create({
        code,
        name,
        description,
        managerId,
        manager,
        parentDepartmentId,
        parentDepartment,
        isActive: true,
      });

      await this.departmentRepository.save(department);

      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a department
   */
  updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const department = await this.departmentRepository.findOne({ 
        where: { id },
        relations: ['manager', 'parentDepartment'] 
      });

      if (!department) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Department not found' },
        });
        return;
      }

      // Check for duplicate code if changing
      if (updateData.code && updateData.code !== department.code) {
        const existing = await this.departmentRepository.findOne({ 
          where: { code: updateData.code } 
        });
        if (existing) {
          res.status(409).json({
            success: false,
            error: { code: 'DUPLICATE_CODE', message: 'Department code already exists' },
          });
          return;
        }
      }

      Object.assign(department, updateData);
      await this.departmentRepository.save(department);

      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete (deactivate) a department
   */
  deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if department has employees
      const employeeCount = await this.employeeRepository.count({
        where: { departmentId: id, isActive: true },
      });

      if (employeeCount > 0) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'CANNOT_DELETE', 
            message: `Cannot delete department with ${employeeCount} active employees` 
          },
        });
        return;
      }

      const department = await this.departmentRepository.findOne({ where: { id } });
      if (!department) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Department not found' },
        });
        return;
      }

      department.isActive = false;
      await this.departmentRepository.save(department);

      res.status(200).json({
        success: true,
        message: 'Department deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get department hierarchy
   */
  getDepartmentHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await this.departmentRepository.find({
        where: { isActive: true },
        relations: ['parentDepartment', 'manager'],
        order: { name: 'ASC' },
      });

      // Build hierarchy tree
      const buildTree = (parentId: string | null): any[] => {
        return departments
          .filter((d) => d.parentDepartmentId === parentId)
          .map((dept) => ({
            ...dept,
            children: buildTree(dept.id),
          }));
      };

      const hierarchy = buildTree(null);

      res.status(200).json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const departmentController = new DepartmentController();

