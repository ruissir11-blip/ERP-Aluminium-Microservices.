import { Request, Response } from 'express';
import { ProfileService } from '../../services/aluminium/ProfileService';
import { CalculationService } from '../../services/aluminium/CalculationService';
import { ProfileType } from '../../models/aluminium/AluminumProfile';
import { isValidUUID } from '../../utils/validators';

export class ProfileController {
  private profileService: ProfileService;
  private calculationService: CalculationService;

  constructor() {
    this.profileService = new ProfileService();
    this.calculationService = new CalculationService();
  }

  /**
   * GET /api/profiles
   * List all profiles with optional filtering and pagination
   */
  async listProfiles(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 10));
      
      const filters = {
        type: req.query.type as ProfileType,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await this.profileService.findAllPaginated(filters, page, perPage);
      res.json({ 
        success: true,
        data: {
          data: result.data,
          total: result.total,
          totalPages: result.totalPages,
          currentPage: page,
          perPage: perPage
        }
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ error: 'Service temporarily unavailable', details: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch profiles', details: errorMessage });
    }
  }

  /**
   * GET /api/profiles/:id
   * Get profile by ID
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid profile ID format' });
        return;
      }
      
      const profile = await this.profileService.findById(id);

      if (!profile) {
        res.status(404).json({ 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Profile not found' 
          } 
        });
        return;
      }

      res.json({ 
        success: true,
        data: profile 
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ error: 'Service temporarily unavailable', details: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch profile', details: errorMessage });
    }
  }

  /**
   * POST /api/profiles
   * Create new profile
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const { reference, name, type, unitPrice } = req.body;
      
      // Basic validation
      if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
        res.status(400).json({ 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Reference is required and must be a non-empty string' 
          } 
        });
        return;
      }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Name is required and must be a non-empty string' 
          } 
        });
        return;
      }
      
      if (!type || !Object.values(ProfileType).includes(type)) {
        res.status(400).json({ 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: `Type is required and must be one of: ${Object.values(ProfileType).join(', ')}` 
          } 
        });
        return;
      }
      
      if (unitPrice === undefined || typeof unitPrice !== 'number' || unitPrice < 0) {
        res.status(400).json({ 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Unit price is required and must be a non-negative number' 
          } 
        });
        return;
      }
      
      const profile = await this.profileService.create(req.body);
      res.status(201).json({ 
        success: true,
        data: profile 
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already exists')) {
        res.status(409).json({ 
          success: false,
          error: { 
            code: 'DUPLICATE_ERROR',
            message: errorMessage 
          } 
        });
        return;
      }
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ 
          success: false,
          error: { 
            code: 'SERVICE_UNAVAILABLE',
            message: errorMessage 
          } 
        });
        return;
      }
      res.status(400).json({ 
        success: false,
        error: { 
          code: 'CREATE_ERROR',
          message: 'Failed to create profile',
          details: errorMessage 
        } 
      });
    }
  }

  /**
   * PUT /api/profiles/:id
   * Update profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await this.profileService.update(id, req.body);
      res.json({ data: profile });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Profile not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage.includes('already exists')) {
        res.status(409).json({ error: errorMessage });
        return;
      }
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ error: 'Service temporarily unavailable', details: errorMessage });
        return;
      }
      res.status(400).json({ error: 'Failed to update profile', details: errorMessage });
    }
  }

  /**
   * DELETE /api/profiles/:id
   * Deactivate profile (soft delete)
   */
  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.profileService.deactivate(id);
      res.status(204).send();
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Profile not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ error: 'Service temporarily unavailable', details: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to deactivate profile', details: errorMessage });
    }
  }

  /**
   * POST /api/profiles/:id/calculate
   * Calculate weight and surface for given dimensions
   */
  async calculate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { length, quantity = 1 } = req.body;

      if (!length || length <= 0) {
        res.status(400).json({ error: 'Invalid length provided' });
        return;
      }

      const profile = await this.profileService.findById(id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const result = this.calculationService.calculateForProfile(profile, {
        length: Number(length),
        quantity: Number(quantity),
      });

      res.json({
        data: {
          weight: result.weight.toNumber(),
          surface: result.surface.toNumber(),
          materialCost: result.materialCost.toNumber(),
        },
      });
    } catch (error) {
      res.status(400).json({
        error: 'Calculation failed',
        details: (error as Error).message,
      });
    }
  }
}
