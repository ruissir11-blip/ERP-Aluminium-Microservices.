import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AluminumModule1710100000000 implements MigrationInterface {
  name = 'AluminumModule1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE profile_type_enum AS ENUM ('PLAT', 'TUBE', 'CORNIERE', 'UPN', 'IPE', 'CUSTOM');
    `);

    // Customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', length: '20', isUnique: true },
          { name: 'company_name', type: 'varchar', length: '255' },
          { name: 'contact_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'billing_street', type: 'varchar', length: '255' },
          { name: 'billing_city', type: 'varchar', length: '100' },
          { name: 'billing_postal_code', type: 'varchar', length: '20' },
          { name: 'billing_country', type: 'varchar', length: '100', default: "'France'" },
          { name: 'shipping_street', type: 'varchar', length: '255', isNullable: true },
          { name: 'shipping_city', type: 'varchar', length: '100', isNullable: true },
          { name: 'shipping_postal_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'shipping_country', type: 'varchar', length: '100', isNullable: true },
          { name: 'payment_terms', type: 'varchar', length: '100', isNullable: true },
          { name: 'vat_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Aluminum profiles table
    await queryRunner.createTable(
      new Table({
        name: 'aluminum_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'reference', type: 'varchar', length: '50', isUnique: true },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'type', type: 'enum', enum: ['PLAT', 'TUBE', 'CORNIERE', 'UPN', 'IPE', 'CUSTOM'] },
          { name: 'length', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'width', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'thickness', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'outer_width', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'inner_width', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'outer_height', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'inner_height', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'diameter', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'inner_diameter', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'technical_specs', type: 'text', isNullable: true },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 4 },
          { name: 'weight_per_meter', type: 'decimal', precision: 10, scale: 4, isNullable: true },
          { name: 'surface_per_meter', type: 'decimal', precision: 10, scale: 4, isNullable: true },
          { name: 'density', type: 'decimal', precision: 6, scale: 3, default: '2.700' },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Add indexes
    await queryRunner.createIndex(
      'customers',
      new TableIndex({ name: 'idx_customers_code', columnNames: ['code'] })
    );
    await queryRunner.createIndex(
      'customers',
      new TableIndex({ name: 'idx_customers_company', columnNames: ['company_name'] })
    );
    await queryRunner.createIndex(
      'customers',
      new TableIndex({ name: 'idx_customers_active', columnNames: ['is_active'] })
    );

    await queryRunner.createIndex(
      'aluminum_profiles',
      new TableIndex({ name: 'idx_profiles_reference', columnNames: ['reference'] })
    );
    await queryRunner.createIndex(
      'aluminum_profiles',
      new TableIndex({ name: 'idx_profiles_type', columnNames: ['type'] })
    );
    await queryRunner.createIndex(
      'aluminum_profiles',
      new TableIndex({ name: 'idx_profiles_active', columnNames: ['is_active'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('aluminum_profiles');
    await queryRunner.dropTable('customers');
    await queryRunner.query(`DROP TYPE IF EXISTS profile_type_enum;`);
  }
}
