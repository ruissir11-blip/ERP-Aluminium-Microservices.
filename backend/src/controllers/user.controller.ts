import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { hashPassword } from '../utils/crypto';
import logger from '../config/logger';

// T044: Create user management endpoints (CRUD)
export class UserController {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  /**
   * List all users
   */
  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = '1', limit = '50', search = '' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (search) {
        queryBuilder.where(
          '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [users, total] = await queryBuilder.getManyAndCount();

      // Remove sensitive data
      const sanitizedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        role: user.role,
      }));

      res.status(200).json({
        success: true,
        data: {
          users: sanitizedUsers,
          total,
          page: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      logger.error('List users error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['role'],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      // Remove sensitive data
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
      };

      res.status(200).json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error) {
      logger.error('Get user error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Create new user
   */
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, roleId } = req.body;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        });
        return;
      }

      // Get role
      let role: Role | undefined;
      if (roleId) {
        const foundRole = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!foundRole) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Invalid role specified',
            },
          });
          return;
        }
        role = foundRole;
      } else {
        // Default to 'user' role
        const defaultRole = await this.roleRepository.findOne({ where: { name: 'user' } });
        if (defaultRole) {
          role = defaultRole;
        }
      }

      if (!role) {
        res.status(500).json({
          success: false,
          error: {
            code: 'NO_DEFAULT_ROLE',
            message: 'Default role not found. Please run database seeds.',
          },
        });
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      const user = this.userRepository.create({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: role,
        isActive: true,
        failedLoginAttempts: 0,
      });

      await this.userRepository.save(user);

      logger.info(`User created: ${user.email}`, { userId: user.id });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      logger.error('Create user error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Update user
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { firstName, lastName, roleId, isActive } = req.body;

      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['role'],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (typeof isActive === 'boolean') user.isActive = isActive;

      // Update role if provided
      if (roleId) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Invalid role specified',
            },
          });
          return;
        }
        user.role = role;
      }

      await this.userRepository.save(user);

      logger.info(`User updated: ${user.email}`, { userId: user.id });

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Update user error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Delete user
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as Request & { user?: { id: string } }).user?.id;

      // Prevent self-deletion
      if (id === currentUserId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SELF_DELETE',
            message: 'Cannot delete your own account',
          },
        });
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      await this.userRepository.remove(user);

      logger.info(`User deleted: ${user.email}`, { userId: user.id });

      res.status(200).json({
        success: true,
        data: { message: 'User deleted successfully' },
      });
    } catch (error) {
      logger.error('Delete user error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Get current user
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      logger.error('Get current user error', { error: (error as Error).message });
      next(error);
    }
  };
}

export default new UserController();
