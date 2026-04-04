// Quality Module Type Definitions

// ==================== ENUMS ====================

export enum ProductionStage {
  CUTTING = 'cutting',
  ASSEMBLY = 'assembly',
  FINISHING = 'finishing',
  PACKING = 'packing',
  SHIPPING = 'shipping',
}

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InspectionResult {
  CONFORME = 'conforme',
  NON_CONFORME = 'non_conforme',
  EN_ATTENTE = 'en_attente',
}

export enum NCSeverity {
  CRITIQUE = 'critique',
  MAJEUR = 'majeur',
  MINEUR = 'mineur',
}

export enum NCStatus {
  OUVERTE = 'ouverte',
  EN_COURS = 'en_cours',
  TRAITEMENT = 'traitement',
  CLOTUREE = 'cloturee',
}

export enum RootCauseMethod {
  CINQ_POURQUOI = 'cinq_pourquoi',
  ISHIKAWA = 'ishikawa',
}

export enum RootCauseCategory {
  MACHINE = 'machine',
  METHODE = 'methode',
  MATERIAU = 'materiau',
  HOMME = 'homme',
  ENVIRONNEMENT = 'environnement',
  MESURE = 'mesure',
}

export enum CorrectiveActionStatus {
  A_FAIRE = 'a_faire',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  VERIFIE = 'verifie',
}

export enum DecisionType {
  CONFORME = 'conforme',
  NON_CONFORME = 'non_conforme',
  A_RETRAVAILLER = 'a_retravailler',
  REBUT = 'rebut',
  DEROGATION = 'derogation',
}

export enum DecisionStatus {
  EN_ATTENTE = 'en_attente',
  APPROUVE = 'approuve',
  REJETE = 'rejete',
}

// ==================== INTERFACES ====================

export interface InspectionPoint {
  id: string;
  production_stage: ProductionStage;
  name: string;
  description?: string;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InspectionPointCreate {
  production_stage: ProductionStage;
  name: string;
  description?: string;
  is_mandatory: boolean;
}

export interface InspectionCriteria {
  id: string;
  inspection_point_id: string;
  parameter_name: string;
  nominal_value: number;
  tolerance_min?: number;
  tolerance_max?: number;
  unit?: string;
  is_active: boolean;
}

export interface InspectionCriteriaCreate {
  inspection_point_id: string;
  parameter_name: string;
  nominal_value: number;
  tolerance_min?: number;
  tolerance_max?: number;
  unit?: string;
}

export interface InspectionRecord {
  id: string;
  production_order_id?: string;
  inspection_point_id: string;
  inspector_id: string;
  status: InspectionStatus;
  result: InspectionResult;
  measured_values_json?: Record<string, unknown>;
  observations?: string;
  signature?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Relations
  inspectionPoint?: InspectionPoint;
  inspector?: User;
}

export interface InspectionRecordCreate {
  production_order_id?: string;
  inspection_point_id: string;
  inspector_id: string;
}

export interface InspectionRecordUpdate {
  status?: InspectionStatus;
  result?: InspectionResult;
  measured_values_json?: Record<string, unknown>;
  observations?: string;
  signature?: string;
}

export interface NonConformity {
  id: string;
  nc_number: string;
  production_order_id?: string;
  lot_number?: string;
  description: string;
  severity: NCSeverity;
  status: NCStatus;
  detected_by: string;
  detected_at: Date;
  closed_at?: Date;
  photos?: string[];
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
  // Relations
  detectedBy?: User;
}

export interface NonConformityCreate {
  production_order_id?: string;
  lot_number?: string;
  description: string;
  severity: NCSeverity;
  detected_by: string;
  photos?: string[];
}

export interface NonConformityUpdate {
  description?: string;
  severity?: NCSeverity;
  status?: NCStatus;
  resolution_notes?: string;
}

export interface NCRootCause {
  id: string;
  nc_id: string;
  method: RootCauseMethod;
  analysis_json?: Record<string, unknown>;
  identified_cause?: string;
  category?: RootCauseCategory;
  recommendations?: string;
  created_at: Date;
  updated_at: Date;
  // Relations
  nonConformity?: NonConformity;
}

export interface NCRootCauseCreate {
  nc_id: string;
  method: RootCauseMethod;
  analysis_json?: Record<string, unknown>;
  identified_cause?: string;
  category?: RootCauseCategory;
}

export interface CorrectiveAction {
  id: string;
  nc_id: string;
  description: string;
  assigned_to?: string;
  due_date: Date;
  status: CorrectiveActionStatus;
  completed_at?: Date;
  effectiveness_verification?: string;
  created_at: Date;
  updated_at: Date;
  // Relations
  nonConformity?: NonConformity;
  assignedTo?: User;
}

export interface CorrectiveActionCreate {
  nc_id: string;
  description: string;
  assigned_to?: string;
  due_date: Date;
}

export interface CorrectiveActionUpdate {
  description?: string;
  assigned_to?: string;
  due_date?: Date;
  status?: CorrectiveActionStatus;
  effectiveness_verification?: string;
}

export interface QualityDecision {
  id: string;
  nc_id: string;
  decision_type: DecisionType;
  status: DecisionStatus;
  approved_by?: string;
  approved_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Relations
  nonConformity?: NonConformity;
  approver?: User;
}

export interface QualityDecisionCreate {
  nc_id: string;
  decision_type: DecisionType;
  notes?: string;
}

export interface QualityDecisionUpdate {
  decision_type?: DecisionType;
  status?: DecisionStatus;
  notes?: string;
}

// ==================== USER TYPE ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
  };
}

// ==================== FILTERS ====================

export interface InspectionRecordFilters {
  status?: InspectionStatus;
  result?: InspectionResult;
  inspectorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface NonConformityFilters {
  status?: NCStatus;
  severity?: NCSeverity;
  startDate?: Date;
  endDate?: Date;
}

export interface CorrectiveActionFilters {
  status?: CorrectiveActionStatus;
  ncId?: string;
  assignedTo?: string;
}

// ==================== STATISTICS ====================

export interface QualityStatistics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  passRate: number;
  ncRate: number;
  openNCs: number;
  closedNCs: number;
  ncBySeverity: Record<NCSeverity, number>;
  ncByStatus: Record<NCStatus, number>;
}

export interface ParetoData {
  type: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface RootCauseStatistics {
  totalAnalyses: number;
  byMethod: Record<RootCauseMethod, number>;
  byCategory: Record<RootCauseCategory, number>;
}
