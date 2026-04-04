import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Role } from '../models/Role';
import logger from '../config/logger';

// T043: Implement list roles endpoint
export class RoleController {
  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  /**
   * List all roles
   */
  listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.roleRepository.find({
        order: { name: 'ASC' },
      });

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      logger.error('List roles error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get role by ID
   */
  getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['users'],
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error('Get role error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Create new role
   */
  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, permissions } = req.body;

      // Check if role already exists
      const existingRole = await this.roleRepository.findOne({
        where: { name },
      });

      if (existingRole) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: 'Role with this name already exists',
          },
        });
        return;
      }

      const role = this.roleRepository.create({
        name,
        description,
        permissions: permissions || [],
        isSystemRole: false,
      });

      await this.roleRepository.save(role);

      logger.info(`Role created: ${role.name}`);

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error('Create role error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Update role
   */
  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { description, permissions } = req.body;

      const role = await this.roleRepository.findOne({
        where: { id },
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        });
        return;
      }

      // Don't allow modifying system roles' permissions completely
      if (role.isSystemRole && permissions) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SYSTEM_ROLE',
            message: 'Cannot modify system role permissions',
          },
        });
        return;
      }

      if (description) role.description = description;
      if (permissions) role.permissions = permissions;

      await this.roleRepository.save(role);

      logger.info(`Role updated: ${role.name}`);

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error('Update role error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Delete role
   */
  deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['users'],
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        });
        return;
      }

      if (role.isSystemRole) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SYSTEM_ROLE',
            message: 'Cannot delete system role',
          },
        });
        return;
      }

      if (role.users && role.users.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_IN_USE',
            message: 'Cannot delete role with assigned users',
          },
        });
        return;
      }

      await this.roleRepository.remove(role);

      logger.info(`Role deleted: ${role.name}`);

      res.status(200).json({
        success: true,
        data: { message: 'Role deleted successfully' },
      });
    } catch (error) {
      logger.error('Delete role error', { error: (error as Error).message });
      next(error);
    }
  };
}

export default new RoleController();
