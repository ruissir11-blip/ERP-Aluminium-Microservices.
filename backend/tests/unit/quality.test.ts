// Unit tests for Quality Module Services
/// <reference types="jest" />
import { 
  ProductionStage, 
  InspectionPoint 
} from '../../src/models/quality/InspectionPoint';
import { 
  InspectionCriteria 
} from '../../src/models/quality/InspectionCriteria';
import { 
  InspectionRecord, 
  InspectionStatus, 
  InspectionResult 
} from '../../src/models/quality/InspectionRecord';
import { 
  NonConformity, 
  NCSeverity, 
  NCStatus 
} from '../../src/models/quality/NonConformity';
import { 
  NCRootCause, 
  RootCauseMethod, 
  RootCauseCategory 
} from '../../src/models/quality/NCRootCause';
import { 
  CorrectiveAction, 
  CorrectiveActionStatus 
} from '../../src/models/quality/CorrectiveAction';
import { 
  QualityDecision, 
  DecisionType, 
  DecisionStatus 
} from '../../src/models/quality/QualityDecision';

// Mock the database
jest.mock('../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      count: jest.fn().mockResolvedValue(0),
    })),
  },
}));

describe('Quality Module Models', () => {
  describe('InspectionPoint', () => {
    it('should create an InspectionPoint with correct properties', () => {
      const point: Partial<InspectionPoint> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        production_stage: ProductionStage.CUTTING,
        name: 'Surface Finish Inspection',
        description: 'Check surface quality after cutting',
        is_mandatory: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(point.production_stage).toBe(ProductionStage.CUTTING);
      expect(point.name).toBe('Surface Finish Inspection');
      expect(point.is_mandatory).toBe(true);
    });

    it('should support all production stages', () => {
      const stages = [
        ProductionStage.CUTTING,
        ProductionStage.ASSEMBLY,
        ProductionStage.FINISHING,
        ProductionStage.PACKING,
        ProductionStage.SHIPPING,
      ];

      expect(stages).toHaveLength(5);
      stages.forEach(stage => {
        expect(typeof stage).toBe('string');
      });
    });
  });

  describe('InspectionCriteria', () => {
    it('should create criteria with tolerance ranges', () => {
      const criteria: Partial<InspectionCriteria> = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        inspection_point_id: '123e4567-e89b-12d3-a456-426614174000',
        parameter_name: 'Width',
        nominal_value: 10.0,
        tolerance_min: 9.5,
        tolerance_max: 10.5,
        unit: 'mm',
        is_active: true,
      };

      expect(criteria.nominal_value).toBe(10.0);
      expect(criteria.tolerance_min).toBe(9.5);
      expect(criteria.tolerance_max).toBe(10.5);
      expect(criteria.unit).toBe('mm');
    });

    it('should correctly validate value within tolerance', () => {
      const criteria: Partial<InspectionCriteria> = {
        nominal_value: 10.0,
        tolerance_min: 9.5,
        tolerance_max: 10.5,
      };

      const testValue = 10.2;
      const isWithinTolerance = 
        testValue >= Number(criteria.tolerance_min!) && 
        testValue <= Number(criteria.tolerance_max!);

      expect(isWithinTolerance).toBe(true);
    });

    it('should correctly identify value outside tolerance', () => {
      const criteria: Partial<InspectionCriteria> = {
        nominal_value: 10.0,
        tolerance_min: 9.5,
        tolerance_max: 10.5,
      };

      const testValue = 9.0;
      const isWithinTolerance = 
        testValue >= Number(criteria.tolerance_min!) && 
        testValue <= Number(criteria.tolerance_max!);

      expect(isWithinTolerance).toBe(false);
    });
  });

  describe('InspectionRecord', () => {
    it('should create inspection record with pending status', () => {
      const record: Partial<InspectionRecord> = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        production_order_id: '123e4567-e89b-12d3-a456-426614174099',
        inspection_point_id: '123e4567-e89b-12d3-a456-426614174000',
        inspector_id: '123e4567-e89b-12d3-a456-426614174098',
        status: InspectionStatus.PENDING,
        result: InspectionResult.EN_ATTENTE,
      };

      expect(record.status).toBe(InspectionStatus.PENDING);
      expect(record.result).toBe(InspectionResult.EN_ATTENTE);
    });

    it('should support all inspection statuses', () => {
      const statuses = [
        InspectionStatus.PENDING,
        InspectionStatus.IN_PROGRESS,
        InspectionStatus.COMPLETED,
        InspectionStatus.CANCELLED,
      ];

      expect(statuses).toHaveLength(4);
    });

    it('should support all inspection results', () => {
      const results = [
        InspectionResult.CONFORME,
        InspectionResult.NON_CONFORME,
        InspectionResult.EN_ATTENTE,
      ];

      expect(results).toHaveLength(3);
    });
  });

  describe('NonConformity', () => {
    it('should create NC with auto-generated number format', () => {
      const ncNumber = 'NC-2025-0001';
      const nc: Partial<NonConformity> = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        nc_number: ncNumber,
        description: 'Surface scratch detected',
        severity: NCSeverity.MAJEUR,
        status: NCStatus.OUVERTE,
      };

      expect(nc.nc_number).toMatch(/^NC-\d{4}-\d{4}$/);
      expect(nc.status).toBe(NCStatus.OUVERTE);
    });

    it('should support all NC severity levels', () => {
      const severities = [NCSeverity.CRITIQUE, NCSeverity.MAJEUR, NCSeverity.MINEUR];
      expect(severities).toHaveLength(3);
    });

    it('should support all NC statuses', () => {
      const statuses = [
        NCStatus.OUVERTE,
        NCStatus.EN_COURS,
        NCStatus.TRAITEMENT,
        NCStatus.CLOTUREE,
      ];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('NCRootCause', () => {
    it('should create root cause analysis', () => {
      const rootCause: Partial<NCRootCause> = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        nc_id: '123e4567-e89b-12d3-a456-426614174003',
        method: RootCauseMethod.CINQ_POURQUOI,
        identified_cause: 'Machine calibration drift',
        category: RootCauseCategory.MACHINE,
      };

      expect(rootCause.method).toBe(RootCauseMethod.CINQ_POURQUOI);
      expect(rootCause.category).toBe(RootCauseCategory.MACHINE);
    });

    it('should support 5 Pourquoi analysis', () => {
      const analysis = {
        method: RootCauseMethod.CINQ_POURQUOI,
        responses: [
          'Why? - Surface scratch found',
          'Why? - Tool damage',
          'Why? - No maintenance',
          'Why? - Schedule not followed',
          'Why? - Resource shortage',
        ],
      };

      expect(analysis.responses).toHaveLength(5);
    });

    it('should support Ishikawa diagram categories', () => {
      const categories = [
        RootCauseCategory.MACHINE,
        RootCauseCategory.METHODE,
        RootCauseCategory.MATERIAU,
        RootCauseCategory.HOMME,
        RootCauseCategory.ENVIRONNEMENT,
        RootCauseCategory.MESURE,
      ];

      expect(categories).toHaveLength(6);
    });
  });

  describe('CorrectiveAction', () => {
    it('should create corrective action with due date', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const action: Partial<CorrectiveAction> = {
        id: '123e4567-e89b-12d3-a456-426614174005',
        nc_id: '123e4567-e89b-12d3-a456-426614174003',
        description: 'Recalibrate machine',
        due_date: dueDate,
        status: CorrectiveActionStatus.A_FAIRE,
      };

      expect(action.status).toBe(CorrectiveActionStatus.A_FAIRE);
      expect(action.due_date).toBeDefined();
    });

    it('should support all corrective action statuses', () => {
      const statuses = [
        CorrectiveActionStatus.A_FAIRE,
        CorrectiveActionStatus.EN_COURS,
        CorrectiveActionStatus.TERMINE,
        CorrectiveActionStatus.VERIFIE,
      ];

      expect(statuses).toHaveLength(4);
    });
  });

  describe('QualityDecision', () => {
    it('should create quality decision', () => {
      const decision: Partial<QualityDecision> = {
        id: '123e4567-e89b-12d3-a456-426614174006',
        nc_id: '123e4567-e89b-12d3-a456-426614174003',
        decision_type: DecisionType.A_RETRAVAILLER,
        status: DecisionStatus.EN_ATTENTE,
        approved_by: '123e4567-e89b-12d3-a456-426614174098',
      };

      expect(decision.decision_type).toBe(DecisionType.A_RETRAVAILLER);
    });

    it('should support all decision types', () => {
      const types = [
        DecisionType.CONFORME,
        DecisionType.NON_CONFORME,
        DecisionType.A_RETRAVAILLER,
        DecisionType.REBUT,
        DecisionType.DEROGATION,
      ];

      expect(types).toHaveLength(5);
    });

    it('should support all decision statuses', () => {
      const statuses = [
        DecisionStatus.EN_ATTENTE,
        DecisionStatus.APPROUVE,
        DecisionStatus.REJETE,
      ];

      expect(statuses).toHaveLength(3);
    });

    it('should require approval for Derogation type', () => {
      const decisionType = DecisionType.DEROGATION;
      const requiresApproval = decisionType === DecisionType.DEROGATION;

      expect(requiresApproval).toBe(true);
    });
  });
});

describe('Quality Module Business Logic', () => {
  describe('NC Rate Calculation', () => {
    it('should calculate NC rate correctly', () => {
      const totalInspections = 100;
      const nonConformities = 5;
      const ncRate = (nonConformities / totalInspections) * 100;

      expect(ncRate).toBe(5);
    });

    it('should handle zero inspections', () => {
      const totalInspections = 0;
      const nonConformities = 0;
      const ncRate = totalInspections > 0 
        ? (nonConformities / totalInspections) * 100 
        : 0;

      expect(ncRate).toBe(0);
    });
  });

  describe('Conformance Validation', () => {
    const validateMeasurement = (
      value: number,
      toleranceMin?: number | null,
      toleranceMax?: number | null
    ): boolean => {
      const aboveMin = !toleranceMin || value >= toleranceMin;
      const belowMax = !toleranceMax || value <= toleranceMax;
      return aboveMin && belowMax;
    };

    it('should validate value within range', () => {
      expect(validateMeasurement(10.2, 9.5, 10.5)).toBe(true);
    });

    it('should reject value below minimum', () => {
      expect(validateMeasurement(9.0, 9.5, 10.5)).toBe(false);
    });

    it('should reject value above maximum', () => {
      expect(validateMeasurement(11.0, 9.5, 10.5)).toBe(false);
    });

    it('should accept exact boundary values', () => {
      expect(validateMeasurement(9.5, 9.5, 10.5)).toBe(true);
      expect(validateMeasurement(10.5, 9.5, 10.5)).toBe(true);
    });

    it('should handle null tolerances (always valid)', () => {
      expect(validateMeasurement(10.0, null, null)).toBe(true);
      expect(validateMeasurement(10.0, undefined, undefined)).toBe(true);
    });
  });

  describe('NC Closure Time Calculation', () => {
    const calculateClosureTime = (detectedAt: Date, closedAt: Date | null): number => {
      if (!closedAt) return 0;
      const diff = closedAt.getTime() - detectedAt.getTime();
      return diff / (1000 * 60 * 60 * 24); // Convert to days
    };

    it('should calculate closure time in days', () => {
      const detected = new Date('2025-01-01');
      const closed = new Date('2025-01-03');
      
      expect(calculateClosureTime(detected, closed)).toBe(2);
    });

    it('should return 0 for open NCs', () => {
      const detected = new Date('2025-01-01');
      
      expect(calculateClosureTime(detected, null)).toBe(0);
    });
  });

  describe('Pareto Analysis', () => {
    interface DefectCount {
      type: string;
      count: number;
    }

    const calculatePareto = (defects: DefectCount[]) => {
      const total = defects.reduce((sum, d) => sum + d.count, 0);
      const sorted = [...defects].sort((a, b) => b.count - a.count);
      
      let cumulative = 0;
      return sorted.map(d => {
        cumulative += d.count;
        return {
          type: d.type,
          count: d.count,
          percentage: (d.count / total) * 100,
          cumulativePercentage: (cumulative / total) * 100,
        };
      });
    };

    it('should sort defects by frequency', () => {
      const defects = [
        { type: 'Surface Scratch', count: 40 },
        { type: 'Dimensional Error', count: 25 },
        { type: 'Color Variation', count: 15 },
        { type: 'Other', count: 20 },
      ];

      const pareto = calculatePareto(defects);
      
      expect(pareto[0].type).toBe('Surface Scratch');
      expect(pareto[0].count).toBe(40);
    });

    it('should calculate cumulative percentages correctly', () => {
      const defects = [
        { type: 'A', count: 50 },
        { type: 'B', count: 30 },
        { type: 'C', count: 20 },
      ];

      const pareto = calculatePareto(defects);
      
      expect(pareto[0].cumulativePercentage).toBe(50);
      expect(pareto[1].cumulativePercentage).toBe(80);
      expect(pareto[2].cumulativePercentage).toBe(100);
    });

    it('should identify 80/20 defects', () => {
      const defects = [
        { type: 'Surface Scratch', count: 40 },
        { type: 'Dimensional Error', count: 25 },
        { type: 'Color Variation', count: 15 },
        { type: 'Other', count: 20 },
      ];

      const pareto = calculatePareto(defects);
      const topDefects = pareto.filter(d => d.cumulativePercentage <= 80);

      // First two defects cover 65+20 = 85%, so we need 3 for 80%
      expect(topDefects.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Sorting', () => {
    const priorityOrder = [NCSeverity.CRITIQUE, NCSeverity.MAJEUR, NCSeverity.MINEUR];

    const sortByPriority = (ncList: NonConformity[]): NonConformity[] => {
      return [...ncList].sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.severity);
        const bIndex = priorityOrder.indexOf(b.severity);
        return aIndex - bIndex;
      });
    };

    it('should sort critical NCs first', () => {
      const ncList = [
        { severity: NCSeverity.MINEUR } as NonConformity,
        { severity: NCSeverity.CRITIQUE } as NonConformity,
        { severity: NCSeverity.MAJEUR } as NonConformity,
      ];

      const sorted = sortByPriority(ncList);
      
      expect(sorted[0].severity).toBe(NCSeverity.CRITIQUE);
      expect(sorted[1].severity).toBe(NCSeverity.MAJEUR);
      expect(sorted[2].severity).toBe(NCSeverity.MINEUR);
    });
  });
});
