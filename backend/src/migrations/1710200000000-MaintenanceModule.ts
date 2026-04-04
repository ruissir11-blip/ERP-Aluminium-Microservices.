import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MaintenanceModule1710200000000 implements MigrationInterface {
  name = 'MaintenanceModule1710200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE machine_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN_DOWN', 'ARCHIVED');
    `);
    
    await queryRunner.query(`
      CREATE TYPE work_order_type_enum AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'IMPROVEMENT', 'INSPECTION');
    `);
    
    await queryRunner.query(`
      CREATE TYPE work_order_status_enum AS ENUM ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED');
    `);
    
    await queryRunner.query(`
      CREATE TYPE work_order_priority_enum AS ENUM ('CRITICAL', 'MAJOR', 'MINOR', 'ROUTINE');
    `);
    
    await queryRunner.query(`
      CREATE TYPE maintenance_frequency_enum AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');
    `);
    
    await queryRunner.query(`
      CREATE TYPE breakdown_severity_enum AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');
    `);

    // Machines table
    await queryRunner.createTable(
      new Table({
        name: 'machines',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'designation', type: 'varchar', length: '255' },
          { name: 'brand', type: 'varchar', length: '100', isNullable: true },
          { name: 'model', type: 'varchar', length: '100', isNullable: true },
          { name: 'serial_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'purchase_date', type: 'date', isNullable: true },
          { name: 'acquisition_value', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'residual_value', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'workshop', type: 'varchar', length: '100', isNullable: true },
          { name: 'location_details', type: 'text', isNullable: true },
          { name: 'installation_date', type: 'date', isNullable: true },
          { name: 'operational_hours', type: 'integer', default: 0 },
          { name: 'status', type: 'enum', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN_DOWN', 'ARCHIVED'], default: "'ACTIVE'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Machine documents table
    await queryRunner.createTable(
      new Table({
        name: 'machine_documents',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'machine_id', type: 'uuid', isNullable: false },
          { name: 'document_type', type: 'varchar', length: '100' },
          { name: 'document_name', type: 'varchar', length: '255' },
          { name: 'file_path', type: 'varchar', length: '500' },
          { name: 'file_size', type: 'integer', isNullable: true },
          { name: 'mime_type', type: 'varchar', length: '100', isNullable: true },
          { name: 'uploaded_by', type: 'uuid', isNullable: true },
          { name: 'uploaded_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Maintenance plans table
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_plans',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'machine_id', type: 'uuid', isNullable: false },
          { name: 'description', type: 'text' },
          { name: 'task_type', type: 'varchar', length: '255' },
          { name: 'frequency', type: 'enum', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'] },
          { name: 'frequency_days', type: 'integer', isNullable: true },
          { name: 'estimated_duration_hours', type: 'decimal', precision: 6, scale: 2, isNullable: true },
          { name: 'next_due_date', type: 'date', isNullable: true },
          { name: 'last_completed_date', type: 'date', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'assigned_technician_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Work orders table
    await queryRunner.createTable(
      new Table({
        name: 'work_orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'work_order_number', type: 'varchar', length: '50', isUnique: true },
          { name: 'machine_id', type: 'uuid', isNullable: false },
          { name: 'maintenance_plan_id', type: 'uuid', isNullable: true },
          { name: 'type', type: 'enum', enum: ['PREVENTIVE', 'CORRECTIVE', 'IMPROVEMENT', 'INSPECTION'] },
          { name: 'status', type: 'enum', enum: ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'], default: "'CREATED'" },
          { name: 'priority', type: 'enum', enum: ['CRITICAL', 'MAJOR', 'MINOR', 'ROUTINE'], default: "'ROUTINE'" },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'scheduled_date', type: 'date', isNullable: true },
          { name: 'scheduled_start_time', type: 'time', isNullable: true },
          { name: 'scheduled_end_time', type: 'time', isNullable: true },
          { name: 'actual_start_datetime', type: 'timestamp', isNullable: true },
          { name: 'actual_end_datetime', type: 'timestamp', isNullable: true },
          { name: 'assigned_to', type: 'uuid', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'labor_hours', type: 'decimal', precision: 6, scale: 2, isNullable: true },
          { name: 'labor_rate', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'labor_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'parts_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'total_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'completion_notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'closed_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true
    );

    // Work order parts table
    await queryRunner.createTable(
      new Table({
        name: 'work_order_parts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'work_order_id', type: 'uuid', isNullable: false },
          { name: 'part_id', type: 'uuid', isNullable: true },
          { name: 'part_reference', type: 'varchar', length: '100' },
          { name: 'part_name', type: 'varchar', length: '255' },
          { name: 'quantity', type: 'decimal', precision: 10, scale: 2 },
          { name: 'unit_cost', type: 'decimal', precision: 12, scale: 4, isNullable: true },
          { name: 'total_cost', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Breakdown records table
    await queryRunner.createTable(
      new Table({
        name: 'breakdown_records',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'work_order_id', type: 'uuid', isNullable: false },
          { name: 'machine_id', type: 'uuid', isNullable: false },
          { name: 'reported_at', type: 'timestamp', default: 'now()' },
          { name: 'acknowledged_at', type: 'timestamp', isNullable: true },
          { name: 'response_time_minutes', type: 'integer', isNullable: true },
          { name: 'repair_start_time', type: 'timestamp', isNullable: true },
          { name: 'repair_end_time', type: 'timestamp', isNullable: true },
          { name: 'repair_time_minutes', type: 'integer', isNullable: true },
          { name: 'downtime_minutes', type: 'integer', isNullable: true },
          { name: 'severity', type: 'enum', enum: ['CRITICAL', 'MAJOR', 'MINOR'] },
          { name: 'symptoms', type: 'text', isNullable: true },
          { name: 'root_cause', type: 'text', isNullable: true },
          { name: 'resolution', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'machines',
      new TableIndex({ name: 'idx_machines_designation', columnNames: ['designation'] })
    );
    await queryRunner.createIndex(
      'machines',
      new TableIndex({ name: 'idx_machines_status', columnNames: ['status'] })
    );
    await queryRunner.createIndex(
      'machines',
      new TableIndex({ name: 'idx_machines_serial', columnNames: ['serial_number'] })
    );

    await queryRunner.createIndex(
      'machine_documents',
      new TableIndex({ name: 'idx_machine_docs_machine', columnNames: ['machine_id'] })
    );

    await queryRunner.createIndex(
      'maintenance_plans',
      new TableIndex({ name: 'idx_maint_plans_machine', columnNames: ['machine_id'] })
    );
    await queryRunner.createIndex(
      'maintenance_plans',
      new TableIndex({ name: 'idx_maint_plans_next_due', columnNames: ['next_due_date'] })
    );
    await queryRunner.createIndex(
      'maintenance_plans',
      new TableIndex({ name: 'idx_maint_plans_active', columnNames: ['is_active'] })
    );

    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_number', columnNames: ['work_order_number'] })
    );
    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_machine', columnNames: ['machine_id'] })
    );
    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_status', columnNames: ['status'] })
    );
    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_priority', columnNames: ['priority'] })
    );
    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_assigned', columnNames: ['assigned_to'] })
    );
    await queryRunner.createIndex(
      'work_orders',
      new TableIndex({ name: 'idx_wo_scheduled', columnNames: ['scheduled_date'] })
    );

    await queryRunner.createIndex(
      'work_order_parts',
      new TableIndex({ name: 'idx_wop_work_order', columnNames: ['work_order_id'] })
    );
    await queryRunner.createIndex(
      'work_order_parts',
      new TableIndex({ name: 'idx_wop_part', columnNames: ['part_id'] })
    );

    await queryRunner.createIndex(
      'breakdown_records',
      new TableIndex({ name: 'idx_br_work_order', columnNames: ['work_order_id'] })
    );
    await queryRunner.createIndex(
      'breakdown_records',
      new TableIndex({ name: 'idx_br_machine', columnNames: ['machine_id'] })
    );
    await queryRunner.createIndex(
      'breakdown_records',
      new TableIndex({ name: 'idx_br_reported', columnNames: ['reported_at'] })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'machine_documents',
      new TableForeignKey({
        name: 'fk_machine_docs_machine',
        columnNames: ['machine_id'],
        referencedTableName: 'machines',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'maintenance_plans',
      new TableForeignKey({
        name: 'fk_maint_plans_machine',
        columnNames: ['machine_id'],
        referencedTableName: 'machines',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'work_orders',
      new TableForeignKey({
        name: 'fk_work_orders_machine',
        columnNames: ['machine_id'],
        referencedTableName: 'machines',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'work_orders',
      new TableForeignKey({
        name: 'fk_work_orders_plan',
        columnNames: ['maintenance_plan_id'],
        referencedTableName: 'maintenance_plans',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'work_order_parts',
      new TableForeignKey({
        name: 'fk_wop_work_order',
        columnNames: ['work_order_id'],
        referencedTableName: 'work_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'breakdown_records',
      new TableForeignKey({
        name: 'fk_br_work_order',
        columnNames: ['work_order_id'],
        referencedTableName: 'work_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'breakdown_records',
      new TableForeignKey({
        name: 'fk_br_machine',
        columnNames: ['machine_id'],
        referencedTableName: 'machines',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('breakdown_records', 'fk_br_machine');
    await queryRunner.dropForeignKey('breakdown_records', 'fk_br_work_order');
    await queryRunner.dropForeignKey('work_order_parts', 'fk_wop_work_order');
    await queryRunner.dropForeignKey('work_orders', 'fk_work_orders_plan');
    await queryRunner.dropForeignKey('work_orders', 'fk_work_orders_machine');
    await queryRunner.dropForeignKey('maintenance_plans', 'fk_maint_plans_machine');
    await queryRunner.dropForeignKey('machine_documents', 'fk_machine_docs_machine');

    // Drop tables
    await queryRunner.dropTable('breakdown_records');
    await queryRunner.dropTable('work_order_parts');
    await queryRunner.dropTable('work_orders');
    await queryRunner.dropTable('maintenance_plans');
    await queryRunner.dropTable('machine_documents');
    await queryRunner.dropTable('machines');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS breakdown_severity_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS maintenance_frequency_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS work_order_priority_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS work_order_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS work_order_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS machine_status_enum;`);
  }
}
