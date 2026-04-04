import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validation schemas for Quality module
 */

// Inspection Point schemas
export const createInspectionPointSchema = z.object({
  production_stage: z.enum(['cutting', 'assembly', 'finishing', 'packing', 'shipping']),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  criteria_json: z.record(z.unknown()).optional(),
  is_mandatory: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateInspectionPointSchema = createInspectionPointSchema.partial();

// Inspection Record schemas
export const createInspectionRecordSchema = z.object({
  production_order_id: z.string().uuid().optional(),
  inspection_point_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  measured_values_json: z.record(z.unknown()).optional(),
  observations: z.string().optional(),
});

export const updateInspectionRecordSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  result: z.enum(['conforme', 'non_conforme', 'en_attente']).optional(),
  measured_values_json: z.record(z.unknown()).optional(),
  observations: z.string().optional(),
  signature: z.string().optional(),
});

// Non-Conformity schemas
export const createNonConformitySchema = z.object({
  production_order_id: z.string().uuid().optional(),
  lot_number: z.string().optional(),
  description: z.string().min(1),
  severity: z.enum(['critique', 'majeur', 'mineur']),
  detected_by: z.string().uuid(),
  photos: z.array(z.string()).optional(),
});

export const updateNonConformitySchema = z.object({
  description: z.string().optional(),
  severity: z.enum(['critique', 'majeur', 'mineur']).optional(),
  status: z.enum(['ouverte', 'en_cours', 'traitement', 'cloturee']).optional(),
  resolution_notes: z.string().optional(),
});

// Corrective Action schemas
export const createCorrectiveActionSchema = z.object({
  nc_id: z.string().uuid(),
  description: z.string().min(1),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime(),
});

export const updateCorrectiveActionSchema = z.object({
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  status: z.enum(['a_faire', 'en_cours', 'termine', 'verifie']).optional(),
  effectiveness_verification: z.string().optional(),
});

// Root Cause schemas
export const createRootCauseSchema = z.object({
  nc_id: z.string().uuid(),
  method: z.enum(['5_pourquoi', 'ishikawa']),
  analysis_json: z.record(z.unknown()).optional(),
  identified_cause: z.string().optional(),
  category: z.enum(['machine', 'methode', 'materiau', 'homme', 'environnement', 'mesure']).optional(),
  recommendations: z.string().optional(),
  analyzed_by: z.string().uuid().optional(),
});

export const updateRootCauseSchema = createRootCauseSchema.partial();

// Quality Decision schemas
export const createQualityDecisionSchema = z.object({
  nc_id: z.string().uuid(),
  decision_type: z.enum(['conforme', 'non_conforme', 'a_retravailler', 'rebut', 'derogation']),
  approved_by: z.string().uuid(),
  approved_at: z.string().datetime(),
  notes: z.string().optional(),
  quantity: z.number().optional(),
  supporting_documents: z.array(z.string()).optional(),
});

export const updateQualityDecisionSchema = z.object({
  decision_type: z.enum(['conforme', 'non_conforme', 'a_retravailler', 'rebut', 'derogation']).optional(),
  status: z.enum(['en_attente', 'approuve', 'rejete']).optional(),
  notes: z.string().optional(),
  quantity: z.number().optional(),
  supporting_documents: z.array(z.string()).optional(),
});

// Statistics query schema
export const statisticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Report query schemas
export const weeklyReportQuerySchema = z.object({
  weekStart: z.string().datetime(),
});

export const monthlyReportQuerySchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

/**
 * Middleware factory for Zod validation
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Query validation middleware
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate inspection record measured values against criteria
 */
export const validateMeasuredValues = async (
  inspectionPointId: string,
  measuredValues: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // In a real implementation, this would fetch the criteria from the database
  // and validate each measured value against its tolerance
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate tolerance range
 */
export const validateTolerance = (
  nominalValue: number,
  measuredValue: number,
  toleranceMin: number | null,
  toleranceMax: number | null
): boolean => {
  if (toleranceMin !== null && measuredValue < toleranceMin) {
    return false;
  }
  if (toleranceMax !== null && measuredValue > toleranceMax) {
    return false;
  }
  return true;
};

/**
 * Check if user has required role for quality operations
 */
export const qualityRoles = {
  INSPECTOR: 'quality_inspector',
  MANAGER: 'quality_manager',
  ADMIN: 'quality_admin',
} as const;

export type QualityRole = typeof qualityRoles[keyof typeof qualityRoles];
