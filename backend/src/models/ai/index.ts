import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum AIModelType {
    FORECASTING = 'FORECASTING',
    STOCKOUT = 'STOCKOUT',
    INVENTORY_OPT = 'INVENTORY_OPT',
    PRODUCTION_SCHEDULING = 'PRODUCTION_SCHEDULING',
}

export enum AIModelStatus {
    TRAINING = 'TRAINING',
    DEPLOYED = 'DEPLOYED',
    ARCHIVED = 'ARCHIVED',
    FAILED = 'FAILED',
}

@Entity('ai_model')
export class AIModel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: 'enum', enum: AIModelType })
    type!: AIModelType;

    @Column({ length: 50 })
    algorithm!: string;

    @Column({ length: 20 })
    version!: string;

    @Column({ type: 'enum', enum: AIModelStatus, default: AIModelStatus.TRAINING })
    status!: AIModelStatus;

    @Column({ type: 'jsonb', nullable: true })
    hyperparameters!: Record<string, any>;

    @Column({ name: 'training_data_start', type: 'date', nullable: true })
    trainingDataStart!: Date;

    @Column({ name: 'training_data_end', type: 'date', nullable: true })
    trainingDataEnd!: Date;

    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
    accuracy!: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
    mape!: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
    rmse!: number;

    @Column({ name: 'trained_at', type: 'timestamp', nullable: true })
    trainedAt!: Date;

    @Column({ name: 'deployed_at', type: 'timestamp', nullable: true })
    deployedAt!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}

export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

@Entity('ai_forecast')
export class AIForecast {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'model_id', nullable: true })
    modelId!: string;

    @ManyToOne(() => AIModel, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'model_id' })
    model!: AIModel;

    @Column({ name: 'product_id', type: 'uuid' })
    productId!: string;

    @Column({ name: 'forecast_date', type: 'date' })
    forecastDate!: Date;

    @Column({ name: 'target_date', type: 'date' })
    targetDate!: Date;

    @Column()
    horizon!: number;

    @Column({ name: 'predicted_quantity', type: 'decimal', precision: 12, scale: 2 })
    predictedQuantity!: number;

    @Column({ name: 'confidence_lower', type: 'decimal', precision: 12, scale: 2, nullable: true })
    confidenceLower!: number;

    @Column({ name: 'confidence_upper', type: 'decimal', precision: 12, scale: 2, nullable: true })
    confidenceUpper!: number;

    @Column({ name: 'confidence_lower_80', type: 'decimal', precision: 12, scale: 2, nullable: true })
    confidenceLower80!: number;

    @Column({ name: 'confidence_upper_80', type: 'decimal', precision: 12, scale: 2, nullable: true })
    confidenceUpper80!: number;

    @Column({ name: 'is_manual', default: false })
    isManual!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

@Entity('ai_forecast_override')
export class AIForecastOverride {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'forecast_id', type: 'uuid' })
    forecastId!: string;

    @ManyToOne(() => AIForecast, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'forecast_id' })
    forecast!: AIForecast;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ name: 'original_quantity', type: 'decimal', precision: 12, scale: 2 })
    originalQuantity!: number;

    @Column({ name: 'override_quantity', type: 'decimal', precision: 12, scale: 2 })
    overrideQuantity!: number;

    @Column({ type: 'text', nullable: true })
    reason!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

@Entity('ai_stockout_prediction')
export class AIStockoutPrediction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'model_id', nullable: true })
    modelId!: string;

    @ManyToOne(() => AIModel, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'model_id' })
    model!: AIModel;

    @Column({ name: 'inventory_item_id', type: 'uuid' })
    inventoryItemId!: string;

    @Column({ name: 'prediction_date', type: 'date' })
    predictionDate!: Date;

    @Column({ name: 'current_stock', type: 'decimal', precision: 12, scale: 2 })
    currentStock!: number;

    @Column({ name: 'predicted_consumption', type: 'decimal', precision: 12, scale: 2 })
    predictedConsumption!: number;

    @Column({ name: 'pending_incoming', type: 'decimal', precision: 12, scale: 2, default: 0 })
    pendingIncoming!: number;

    @Column({ name: 'days_to_stockout' })
    daysToStockout!: number;

    @Column({ name: 'risk_level', type: 'enum', enum: RiskLevel })
    riskLevel!: RiskLevel;

    @Column({ name: 'recommended_reorder_qty', type: 'decimal', precision: 12, scale: 2, nullable: true })
    recommendedReorderQty!: number;

    @Column({ name: 'recommended_reorder_date', type: 'date', nullable: true })
    recommendedReorderDate!: Date;

    @Column({ name: 'lead_time_days', nullable: true })
    leadTimeDays!: number;

    @Column({ name: 'is_acknowledged', default: false })
    isAcknowledged!: boolean;

    @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
    acknowledgedBy!: string;

    @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
    acknowledgedAt!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

@Entity('ai_inventory_optimization')
export class AIInventoryOptimization {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'model_id', nullable: true })
    modelId!: string;

    @ManyToOne(() => AIModel, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'model_id' })
    model!: AIModel;

    @Column({ name: 'inventory_item_id', type: 'uuid' })
    inventoryItemId!: string;

    @Column({ name: 'calculation_date', type: 'date' })
    calculationDate!: Date;

    @Column({ name: 'current_order_qty', type: 'decimal', precision: 12, scale: 2 })
    currentOrderQty!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    eoq!: number;

    @Column({ name: 'reorder_point', type: 'decimal', precision: 12, scale: 2 })
    reorderPoint!: number;

    @Column({ name: 'safety_stock', type: 'decimal', precision: 12, scale: 2 })
    safetyStock!: number;

    @Column({ name: 'minimum_order_qty', type: 'decimal', precision: 12, scale: 2, nullable: true })
    minimumOrderQty!: number;

    @Column({ name: 'annual_demand', type: 'decimal', precision: 12, scale: 2 })
    annualDemand!: number;

    @Column({ name: 'ordering_cost', type: 'decimal', precision: 10, scale: 2 })
    orderingCost!: number;

    @Column({ name: 'holding_cost_rate', type: 'decimal', precision: 5, scale: 4 })
    holdingCostRate!: number;

    @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 4 })
    unitCost!: number;

    @Column({ name: 'expected_annual_savings', type: 'decimal', precision: 10, scale: 2, nullable: true })
    expectedAnnualSavings!: number;

    @Column({ name: 'order_frequency', type: 'decimal', precision: 6, scale: 2, nullable: true })
    orderFrequency!: number;

    @Column({ name: 'current_annual_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
    currentAnnualCost!: number;

    @Column({ name: 'optimized_annual_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
    optimizedAnnualCost!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

export enum OptimizationType {
    SEQUENCE = 'SEQUENCE',
    CAPACITY = 'CAPACITY',
    CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION',
}

export enum ConflictType {
    MACHINE = 'MACHINE',
    MATERIAL = 'MATERIAL',
    LABOR = 'LABOR',
    DEADLINE = 'DEADLINE',
}

@Entity('ai_production_schedule')
export class AIProductionSchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'model_id', nullable: true })
    modelId!: string;

    @ManyToOne(() => AIModel, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'model_id' })
    model!: AIModel;

    @Column({ name: 'schedule_date', type: 'date' })
    scheduleDate!: Date;

    @Column({ name: 'optimization_type', length: 50 })
    optimizationType!: OptimizationType;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate!: Date;

    @Column({ name: 'total_makespan', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalMakespan!: number;

    @Column({ name: 'total_orders' })
    totalOrders!: number;

    @Column({ name: 'conflicts_detected', default: 0 })
    conflictsDetected!: number;

    @Column({ name: 'conflicts_resolved', default: 0 })
    conflictsResolved!: number;

    @Column({ name: 'generated_schedule', type: 'jsonb' })
    generatedSchedule!: Record<string, any>;

    @Column({ name: 'baseline_makespan', type: 'decimal', precision: 10, scale: 2, nullable: true })
    baselineMakespan!: number;

    @Column({ name: 'improvement_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
    improvementPercent!: number;

    @Column({ name: 'generated_by', type: 'uuid', nullable: true })
    generatedBy!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

export enum ConflictSeverity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
}

@Entity('ai_production_conflict')
export class AIProductionConflict {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'schedule_id', type: 'uuid' })
    scheduleId!: string;

    @ManyToOne(() => AIProductionSchedule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'schedule_id' })
    schedule!: AIProductionSchedule;

    @Column({ name: 'conflict_type', length: 50 })
    conflictType!: ConflictType;

    @Column({ type: 'enum', enum: ConflictSeverity })
    severity!: ConflictSeverity;

    @Column({ name: 'resource_type', length: 50 })
    resourceType!: string;

    @Column({ name: 'resource_id', type: 'uuid' })
    resourceId!: string;

    @Column({ name: 'order_ids', type: 'jsonb' })
    orderIds!: string[];

    @Column()
    description!: string;

    @Column({ name: 'suggested_resolution', type: 'text', nullable: true })
    suggestedResolution!: string;

    @Column({ name: 'is_resolved', default: false })
    isResolved!: boolean;

    @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
    resolvedBy!: string;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

export enum JobStatus {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum JobType {
    FULL_RETRAIN = 'FULL_RETRAIN',
    INCREMENTAL = 'INCREMENTAL',
    HYPERPARAM_TUNING = 'HYPERPARAM_TUNING',
}

@Entity('ai_training_job')
export class AITrainingJob {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'model_id', type: 'uuid' })
    modelId!: string;

    @ManyToOne(() => AIModel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'model_id' })
    model!: AIModel;

    @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
    status!: JobStatus;

    @Column({ name: 'job_type', length: 50 })
    jobType!: JobType;

    @Column({ name: 'started_at', type: 'timestamp', nullable: true })
    startedAt!: Date;

    @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
    completedAt!: Date;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage!: string;

    @Column({ default: 0 })
    progress!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
