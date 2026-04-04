import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class AIModule1700000000000 implements MigrationInterface {
    name = 'AIModule1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create AIModel table
        await queryRunner.createTable(
            new Table({
                name: 'ai_model',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'name', type: 'varchar', length: '100', isNullable: false },
                    { name: 'type', type: 'enum', enum: ['FORECASTING', 'STOCKOUT', 'INVENTORY_OPT', 'PRODUCTION_SCHEDULING'], isNullable: false },
                    { name: 'algorithm', type: 'varchar', length: '50', isNullable: false },
                    { name: 'version', type: 'varchar', length: '20', isNullable: false },
                    { name: 'status', type: 'enum', enum: ['TRAINING', 'DEPLOYED', 'ARCHIVED', 'FAILED'], default: "'TRAINING'" },
                    { name: 'hyperparameters', type: 'jsonb', isNullable: true },
                    { name: 'training_data_start', type: 'date', isNullable: true },
                    { name: 'training_data_end', type: 'date', isNullable: true },
                    { name: 'accuracy', type: 'decimal', precision: 5, scale: 4, isNullable: true },
                    { name: 'mape', type: 'decimal', precision: 5, scale: 4, isNullable: true },
                    { name: 'rmse', type: 'decimal', precision: 10, scale: 4, isNullable: true },
                    { name: 'trained_at', type: 'timestamp', isNullable: true },
                    { name: 'deployed_at', type: 'timestamp', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            'ai_model',
            new TableIndex({ name: 'idx_aimodel_type_status', columnNames: ['type', 'status'] })
        );

        await queryRunner.createIndex(
            'ai_model',
            new TableIndex({ name: 'idx_aimodel_name_version', columnNames: ['name', 'version'], isUnique: true })
        );

        // Create AIForecast table
        await queryRunner.createTable(
            new Table({
                name: 'ai_forecast',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'model_id', type: 'uuid', isNullable: true },
                    { name: 'product_id', type: 'uuid', isNullable: false },
                    { name: 'forecast_date', type: 'date', isNullable: false },
                    { name: 'target_date', type: 'date', isNullable: false },
                    { name: 'horizon', type: 'integer', isNullable: false },
                    { name: 'predicted_quantity', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'confidence_lower', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'confidence_upper', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'confidence_lower_80', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'confidence_upper_80', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'is_manual', type: 'boolean', default: false },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            'ai_forecast',
            new TableIndex({ name: 'idx_aiforecast_product_horizon', columnNames: ['product_id', 'horizon'] })
        );

        await queryRunner.createIndex(
            'ai_forecast',
            new TableIndex({ name: 'idx_aiforecast_target_date', columnNames: ['target_date'] })
        );

        await queryRunner.createForeignKey(
            'ai_forecast',
            new TableForeignKey({
                name: 'fk_aiforecast_model',
                columnNames: ['model_id'],
                referencedTableName: 'ai_model',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        // Create AIForecastOverride table
        await queryRunner.createTable(
            new Table({
                name: 'ai_forecast_override',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'forecast_id', type: 'uuid', isNullable: false },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    { name: 'original_quantity', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'override_quantity', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'reason', type: 'text', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'ai_forecast_override',
            new TableForeignKey({
                name: 'fk_override_forecast',
                columnNames: ['forecast_id'],
                referencedTableName: 'ai_forecast',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        // Create AIStockoutPrediction table
        await queryRunner.createTable(
            new Table({
                name: 'ai_stockout_prediction',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'model_id', type: 'uuid', isNullable: true },
                    { name: 'inventory_item_id', type: 'uuid', isNullable: false },
                    { name: 'prediction_date', type: 'date', isNullable: false },
                    { name: 'current_stock', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'predicted_consumption', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'pending_incoming', type: 'decimal', precision: 12, scale: 2, default: 0 },
                    { name: 'days_to_stockout', type: 'integer', isNullable: false },
                    { name: 'risk_level', type: 'enum', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], isNullable: false },
                    { name: 'recommended_reorder_qty', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'recommended_reorder_date', type: 'date', isNullable: true },
                    { name: 'lead_time_days', type: 'integer', isNullable: true },
                    { name: 'is_acknowledged', type: 'boolean', default: false },
                    { name: 'acknowledged_by', type: 'uuid', isNullable: true },
                    { name: 'acknowledged_at', type: 'timestamp', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            'ai_stockout_prediction',
            new TableIndex({ name: 'idx_aistockout_item_date', columnNames: ['inventory_item_id', 'prediction_date'] })
        );

        await queryRunner.createIndex(
            'ai_stockout_prediction',
            new TableIndex({ name: 'idx_aistockout_risk_level', columnNames: ['risk_level'] })
        );

        await queryRunner.createForeignKey(
            'ai_stockout_prediction',
            new TableForeignKey({
                name: 'fk_stockout_model',
                columnNames: ['model_id'],
                referencedTableName: 'ai_model',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        // Create AIInventoryOptimization table
        await queryRunner.createTable(
            new Table({
                name: 'ai_inventory_optimization',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'model_id', type: 'uuid', isNullable: true },
                    { name: 'inventory_item_id', type: 'uuid', isNullable: false },
                    { name: 'calculation_date', type: 'date', isNullable: false },
                    { name: 'current_order_qty', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'eoq', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'reorder_point', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'safety_stock', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'minimum_order_qty', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'annual_demand', type: 'decimal', precision: 12, scale: 2, isNullable: false },
                    { name: 'ordering_cost', type: 'decimal', precision: 10, scale: 2, isNullable: false },
                    { name: 'holding_cost_rate', type: 'decimal', precision: 5, scale: 4, isNullable: false },
                    { name: 'unit_cost', type: 'decimal', precision: 10, scale: 4, isNullable: false },
                    { name: 'expected_annual_savings', type: 'decimal', precision: 10, scale: 2, isNullable: true },
                    { name: 'order_frequency', type: 'decimal', precision: 6, scale: 2, isNullable: true },
                    { name: 'current_annual_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'optimized_annual_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            'ai_inventory_optimization',
            new TableIndex({ name: 'idx_aiinventory_item', columnNames: ['inventory_item_id'] })
        );

        await queryRunner.createForeignKey(
            'ai_inventory_optimization',
            new TableForeignKey({
                name: 'fk_optimization_model',
                columnNames: ['model_id'],
                referencedTableName: 'ai_model',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        // Create AIProductionSchedule table
        await queryRunner.createTable(
            new Table({
                name: 'ai_production_schedule',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'model_id', type: 'uuid', isNullable: true },
                    { name: 'schedule_date', type: 'date', isNullable: false },
                    { name: 'optimization_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'start_date', type: 'date', isNullable: false },
                    { name: 'end_date', type: 'date', isNullable: false },
                    { name: 'total_makespan', type: 'decimal', precision: 10, scale: 2, isNullable: true },
                    { name: 'total_orders', type: 'integer', isNullable: false },
                    { name: 'conflicts_detected', type: 'integer', default: 0 },
                    { name: 'conflicts_resolved', type: 'integer', default: 0 },
                    { name: 'generated_schedule', type: 'jsonb', isNullable: false },
                    { name: 'baseline_makespan', type: 'decimal', precision: 10, scale: 2, isNullable: true },
                    { name: 'improvement_percent', type: 'decimal', precision: 5, scale: 2, isNullable: true },
                    { name: 'generated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            'ai_production_schedule',
            new TableIndex({ name: 'idx_aiproduction_date', columnNames: ['schedule_date'] })
        );

        await queryRunner.createForeignKey(
            'ai_production_schedule',
            new TableForeignKey({
                name: 'fk_schedule_model',
                columnNames: ['model_id'],
                referencedTableName: 'ai_model',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        // Create AIProductionConflict table
        await queryRunner.createTable(
            new Table({
                name: 'ai_production_conflict',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'schedule_id', type: 'uuid', isNullable: false },
                    { name: 'conflict_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'severity', type: 'enum', enum: ['CRITICAL', 'HIGH', 'MEDIUM'], isNullable: false },
                    { name: 'resource_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'resource_id', type: 'uuid', isNullable: false },
                    { name: 'order_ids', type: 'jsonb', isNullable: false },
                    { name: 'description', type: 'text', isNullable: false },
                    { name: 'suggested_resolution', type: 'text', isNullable: true },
                    { name: 'is_resolved', type: 'boolean', default: false },
                    { name: 'resolved_by', type: 'uuid', isNullable: true },
                    { name: 'resolved_at', type: 'timestamp', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'ai_production_conflict',
            new TableForeignKey({
                name: 'fk_conflict_schedule',
                columnNames: ['schedule_id'],
                referencedTableName: 'ai_production_schedule',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        // Create AITrainingJob table
        await queryRunner.createTable(
            new Table({
                name: 'ai_training_job',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'model_id', type: 'uuid', isNullable: false },
                    { name: 'status', type: 'enum', enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'], default: "'QUEUED'" },
                    { name: 'job_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'started_at', type: 'timestamp', isNullable: true },
                    { name: 'completed_at', type: 'timestamp', isNullable: true },
                    { name: 'error_message', type: 'text', isNullable: true },
                    { name: 'progress', type: 'integer', default: 0 },
                    { name: 'created_at', type: 'timestamp', default: 'now()' },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'ai_training_job',
            new TableForeignKey({
                name: 'fk_job_model',
                columnNames: ['model_id'],
                referencedTableName: 'ai_model',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('ai_training_job');
        await queryRunner.dropTable('ai_production_conflict');
        await queryRunner.dropTable('ai_production_schedule');
        await queryRunner.dropTable('ai_inventory_optimization');
        await queryRunner.dropTable('ai_stockout_prediction');
        await queryRunner.dropTable('ai_forecast_override');
        await queryRunner.dropTable('ai_forecast');
        await queryRunner.dropTable('ai_model');
    }
}
