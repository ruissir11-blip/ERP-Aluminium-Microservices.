import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class ComptabiliteModule1700000000000 implements MigrationInterface {
  name = 'ComptabiliteModule1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cost Component table
    await queryRunner.createTable(
      new Table({
        name: 'cost_component',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            default: 0,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Product Cost table
    await queryRunner.createTable(
      new Table({
        name: 'product_cost',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'profile_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'material_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'labor_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'overhead_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for product_cost
    await queryRunner.createIndex(
      'product_cost',
      new TableIndex({
        name: 'idx_product_cost_profile',
        columnNames: ['profile_id'],
      })
    );
    await queryRunner.createIndex(
      'product_cost',
      new TableIndex({
        name: 'idx_product_cost_calculated',
        columnNames: ['calculated_at'],
      })
    );

    // Order Costing table
    await queryRunner.createTable(
      new Table({
        name: 'order_costing',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'material_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'labor_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'overhead_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'margin',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'margin_percent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'estimated_margin',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'actual_margin',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'margin_variance',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for order_costing
    await queryRunner.createIndex(
      'order_costing',
      new TableIndex({
        name: 'idx_order_costing_order',
        columnNames: ['order_id'],
      })
    );
    await queryRunner.createIndex(
      'order_costing',
      new TableIndex({
        name: 'idx_order_costing_margin',
        columnNames: ['margin_percent'],
      })
    );

    // Customer Profitability table
    await queryRunner.createTable(
      new Table({
        name: 'customer_profitability',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'total_revenue',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_margin',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'margin_percent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'order_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for customer_profitability
    await queryRunner.createIndex(
      'customer_profitability',
      new TableIndex({
        name: 'idx_customer_profit_customer',
        columnNames: ['customer_id'],
      })
    );
    await queryRunner.createIndex(
      'customer_profitability',
      new TableIndex({
        name: 'idx_customer_profit_calculated',
        columnNames: ['calculated_at'],
      })
    );

    // Commercial Performance table
    await queryRunner.createTable(
      new Table({
        name: 'commercial_performance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'commercial_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'order_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'margin',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'conversion_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'target_revenue',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'achievement_pct',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for commercial_performance
    await queryRunner.createIndex(
      'commercial_performance',
      new TableIndex({
        name: 'idx_commercial_perf_user',
        columnNames: ['commercial_id'],
      })
    );
    await queryRunner.createIndex(
      'commercial_performance',
      new TableIndex({
        name: 'idx_commercial_perf_period',
        columnNames: ['period_start', 'period_end'],
      })
    );

    // Financial KPI table
    await queryRunner.createTable(
      new Table({
        name: 'financial_kpi',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'kpi_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'period',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for financial_kpi
    await queryRunner.createIndex(
      'financial_kpi',
      new TableIndex({
        name: 'idx_financial_kpi_type',
        columnNames: ['kpi_type'],
      })
    );
    await queryRunner.createIndex(
      'financial_kpi',
      new TableIndex({
        name: 'idx_financial_kpi_period',
        columnNames: ['period'],
      })
    );

    // Equipment ROI table
    await queryRunner.createTable(
      new Table({
        name: 'equipment_roi',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'equipment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'investment_cost',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'annual_benefit',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'roi_percent',
            type: 'decimal',
            precision: 8,
            scale: 2,
            default: 0,
          },
          {
            name: 'payback_years',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 0,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for equipment_roi
    await queryRunner.createIndex(
      'equipment_roi',
      new TableIndex({
        name: 'idx_equipment_roi_equipment',
        columnNames: ['equipment_id'],
      })
    );

    // Receivable Aging table
    await queryRunner.createTable(
      new Table({
        name: 'receivable_aging',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'period',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'aging_0_30',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'aging_31_60',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'aging_61_90',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'aging_90_plus',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 14,
            scale: 2,
            default: 0,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add indexes for receivable_aging
    await queryRunner.createIndex(
      'receivable_aging',
      new TableIndex({
        name: 'idx_receivable_aging_customer',
        columnNames: ['customer_id'],
      })
    );
    await queryRunner.createIndex(
      'receivable_aging',
      new TableIndex({
        name: 'idx_receivable_aging_period',
        columnNames: ['period'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.dropTable('receivable_aging');
    await queryRunner.dropTable('equipment_roi');
    await queryRunner.dropTable('financial_kpi');
    await queryRunner.dropTable('commercial_performance');
    await queryRunner.dropTable('customer_profitability');
    await queryRunner.dropTable('order_costing');
    await queryRunner.dropTable('product_cost');
    await queryRunner.dropTable('cost_component');
  }
}
