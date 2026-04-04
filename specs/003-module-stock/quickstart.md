# Quickstart Guide: Stock Management Module

**Feature**: 003-module-stock  
**Date**: 2026-03-04  
**Prerequisites**: 001-auth-security module and 002-module-aluminium module implemented and running

---

## Overview

This guide covers the implementation of the Advanced Stock Management Module, including:

1. Database migrations for stock entities
2. Backend service implementation
3. FIFO valuation layer management
4. Lot traceability
5. Inventory counting workflow
6. Testing approach

---

## 1. Prerequisites

### Dependencies

Ensure the aluminium module is already implemented as it provides:
- [`AluminumProfile`](specs/002-module-aluminium/data-model.md) entity (linked via profileId)
- [`Customer`](specs/002-module-aluminium/data-model.md) entity (for supplier references)
- Authentication and RBAC middleware

### Install Additional Dependencies

```bash
cd backend
npm install uuid
npm install -D @types/uuid
```

---

## 2. Database Setup

### TypeORM Migrations

Create migration file: `src/migrations/1710200000000-StockModule.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class StockModule1710200000000 implements MigrationInterface {
  name = 'StockModule1710200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE lot_quality_status_enum AS ENUM ('APPROVED', 'QUARANTINE', 'REJECTED');
      CREATE TYPE movement_type_enum AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'COUNT');
      CREATE TYPE inventory_count_status_enum AS ENUM ('DRAFT', 'IN_PROGRESS', 'VARIANCE_REVIEW', 'ADJUSTMENT_APPROVED', 'COMPLETED', 'CANCELLED');
      CREATE TYPE count_type_enum AS ENUM ('FULL', 'CYCLE', 'SPOT');
      CREATE TYPE traceability_event_enum AS ENUM ('RECEIPT', 'PRODUCTION', 'DELIVERY', 'RETURN', 'TRANSFER');
    `);

    // Warehouses table
    await queryRunner.createTable(
      new Table({
        name: 'warehouses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', length: '20', isUnique: true },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'contact_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'contact_email', type: 'varchar', length: '255', isNullable: true },
          { name: 'contact_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Storage locations table
    await queryRunner.createTable(
      new Table({
        name: 'storage_locations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'warehouse_id', type: 'uuid' },
          { name: 'zone', type: 'varchar', length: '50' },
          { name: 'rack', type: 'varchar', length: '50' },
          { name: 'aisle', type: 'varchar', length: '50' },
          { name: 'level', type: 'varchar', length: '20' },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'max_weight', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'max_volume', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'storage_locations',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Lots table
    await queryRunner.createTable(
      new Table({
        name: 'lots',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'lot_number', type: 'varchar', length: '50' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'supplier_id', type: 'uuid' },
          { name: 'receipt_date', type: 'date' },
          { name: 'initial_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'unit_cost', type: 'decimal', precision: 12, scale: 4 },
          { name: 'certificate_of_conformity', type: 'varchar', length: '255', isNullable: true },
          { name: 'expiry_date', type: 'date', isNullable: true },
          { name: 'quality_status', type: 'lot_quality_status_enum', default: 'QUARANTINE' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'lots',
      new TableForeignKey({
        columnNames: ['profile_id'],
        referencedTableName: 'aluminum_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'lots',
      new TableForeignKey({
        columnNames: ['supplier_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // Inventory items table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'warehouse_id', type: 'uuid' },
          { name: 'location_id', type: 'uuid', isNullable: true },
          { name: 'lot_id', type: 'uuid', isNullable: true },
          { name: 'quantity_on_hand', type: 'decimal', precision: 10, scale: 3, default: 0 },
          { name: 'quantity_reserved', type: 'decimal', precision: 10, scale: 3, default: 0 },
          { name: 'average_unit_cost', type: 'decimal', precision: 12, scale: 4, isNullable: true },
          { name: 'last_movement_date', type: 'timestamp', isNullable: true },
          { name: 'version', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['profile_id'],
        referencedTableName: 'aluminum_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['location_id'],
        referencedTableName: 'storage_locations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['lot_id'],
        referencedTableName: 'lots',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Unique constraint for inventory items
    await queryRunner.createIndex(
      'inventory_items',
      new TableIndex({
        name: 'idx_inventory_unique_location',
        columnNames: ['profile_id', 'warehouse_id', 'location_id', 'lot_id'],
        isUnique: true,
      })
    );

    // Stock movements table
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'warehouse_id', type: 'uuid' },
          { name: 'location_id', type: 'uuid', isNullable: true },
          { name: 'lot_id', type: 'uuid', isNullable: true },
          { name: 'movement_type', type: 'movement_type_enum' },
          { name: 'quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'unit_cost', type: 'decimal', precision: 12, scale: 4, isNullable: true },
          { name: 'total_cost', type: 'decimal', precision: 14, scale: 4, isNullable: true },
          { name: 'reference_type', type: 'varchar', length: '50' },
          { name: 'reference_id', type: 'varchar', length: '50' },
          { name: 'source_warehouse_id', type: 'uuid', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'performed_by', type: 'uuid' },
          { name: 'performed_at', type: 'timestamp' },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          { name: 'previous_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'new_quantity', type: 'decimal', precision: 10, scale: 3 },
        ],
      }),
      true
    );

    // Stock alerts table
    await queryRunner.createTable(
      new Table({
        name: 'stock_alerts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'warehouse_id', type: 'uuid', isNullable: true },
          { name: 'minimum_threshold', type: 'decimal', precision: 10, scale: 3 },
          { name: 'maximum_threshold', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'reorder_point', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'email_recipients', type: 'text', isNullable: true, isArray: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'is_triggered', type: 'boolean', default: false },
          { name: 'last_triggered_at', type: 'timestamp', isNullable: true },
          { name: 'acknowledged_at', type: 'timestamp', isNullable: true },
          { name: 'acknowledged_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Inventory counts table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_counts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'count_number', type: 'varchar', length: '20', isUnique: true },
          { name: 'warehouse_id', type: 'uuid' },
          { name: 'status', type: 'inventory_count_status_enum', default: 'DRAFT' },
          { name: 'count_type', type: 'count_type_enum' },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'initiated_by', type: 'uuid' },
          { name: 'reviewed_by', type: 'uuid', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Inventory count lines table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_count_lines',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'count_id', type: 'uuid' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'location_id', type: 'uuid' },
          { name: 'lot_id', type: 'uuid', isNullable: true },
          { name: 'system_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'counted_quantity', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'variance', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'variance_percentage', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'count_status', type: 'varchar', length: '20', default: 'PENDING' },
          { name: 'reason_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'counted_by', type: 'uuid', isNullable: true },
          { name: 'counted_at', type: 'timestamp', isNullable: true },
          { name: 'is_adjusted', type: 'boolean', default: false },
          { name: 'adjustment_posted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true
    );

    // Lot traceability table
    await queryRunner.createTable(
      new Table({
        name: 'lot_traceability',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'lot_id', type: 'uuid' },
          { name: 'parent_traceability_id', type: 'uuid', isNullable: true },
          { name: 'event_type', type: 'traceability_event_enum' },
          { name: 'event_date', type: 'timestamp' },
          { name: 'reference_type', type: 'varchar', length: '50' },
          { name: 'reference_id', type: 'varchar', length: '50' },
          { name: 'quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'path', type: 'varchar', length: '500' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Stock layers table (FIFO)
    await queryRunner.createTable(
      new Table({
        name: 'stock_layers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'lot_id', type: 'uuid', isNullable: true },
          { name: 'warehouse_id', type: 'uuid' },
          { name: 'receipt_date', type: 'timestamp' },
          { name: 'original_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'remaining_quantity', type: 'decimal', precision: 10, scale: 3 },
          { name: 'unit_cost', type: 'decimal', precision: 12, scale: 4 },
          { name: 'reference_type', type: 'varchar', length: '50' },
          { name: 'reference_id', type: 'varchar', length: '50' },
          { name: 'is_exhausted', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order for drop
    await queryRunner.dropTable('stock_layers');
    await queryRunner.dropTable('lot_traceability');
    await queryRunner.dropTable('inventory_count_lines');
    await queryRunner.dropTable('inventory_counts');
    await queryRunner.dropTable('stock_alerts');
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('inventory_items');
    await queryRunner.dropTable('lots');
    await queryRunner.dropTable('storage_locations');
    await queryRunner.dropTable('warehouses');

    await queryRunner.query(`
      DROP TYPE IF EXISTS stock_layers;
      DROP TYPE IF EXISTS traceability_event_enum;
      DROP TYPE IF EXISTS count_type_enum;
      DROP TYPE IF EXISTS inventory_count_status_enum;
      DROP TYPE IF EXISTS movement_type_enum;
      DROP TYPE IF EXISTS lot_quality_status_enum;
    `);
  }
}
```

Run migration:
```bash
npm run migration:run
```

---

## 3. Backend Implementation

### Entity: Warehouse

Create `src/models/stock/Warehouse.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { StorageLocation } from './StorageLocation';
import { InventoryItem } from './InventoryItem';

@Entity('warehouses')
@Index(['code'], { unique: true })
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, name: 'contact_name', nullable: true })
  contactName?: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => StorageLocation, location => location.warehouse)
  locations!: StorageLocation[];

  @OneToMany(() => InventoryItem, item => item.warehouse)
  inventoryItems!: InventoryItem[];
}
```

### Entity: Lot

Create `src/models/stock/Lot.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { AluminumProfile } from '../aluminium/AluminumProfile';
import { Customer } from '../aluminium/Customer';
import { LotTraceability } from './LotTraceability';

export enum LotQualityStatus {
  APPROVED = 'APPROVED',
  QUARANTINE = 'QUARANTINE',
  REJECTED = 'REJECTED',
}

@Entity('lots')
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'lot_number' })
  lotNumber!: string;

  @Column({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  @ManyToOne(() => AluminumProfile)
  @JoinColumn({ name: 'profile_id' })
  profile!: AluminumProfile;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Customer;

  @Column({ type: 'date', name: 'receipt_date' })
  receiptDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'initial_quantity' })
  initialQuantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'remaining_quantity' })
  remainingQuantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, name: 'unit_cost' })
  unitCost!: number;

  @Column({ type: 'varchar', length: 255, name: 'certificate_of_conformity', nullable: true })
  certificateOfConformity?: string;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'enum', enum: LotQualityStatus, name: 'quality_status', default: LotQualityStatus.QUARANTINE })
  qualityStatus!: LotQualityStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => LotTraceability, trace => trace.lot)
  traceability!: LotTraceability[];
}
```

### Service: InventoryService

Create `src/services/stock/InventoryService.ts`:

```typescript
import { Repository, getRepository, DataSource } from 'typeorm';
import { InventoryItem } from '../../models/stock/InventoryItem';
import { StockMovement, MovementType } from '../../models/stock/StockMovement';
import { StockLayer } from '../../models/stock/StockLayer';
import { AppError } from '../../middleware/errorHandler';

export interface StockTransferInput {
  profileId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  lotId?: string;
  quantity: number;
  notes?: string;
  performedBy: string;
  ipAddress?: string;
}

export class InventoryService {
  private inventoryRepo: Repository<InventoryItem>;
  private movementRepo: Repository<StockMovement>;
  private layerRepo: Repository<StockLayer>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.inventoryRepo = dataSource.getRepository(InventoryItem);
    this.movementRepo = dataSource.getRepository(StockMovement);
    this.layerRepo = dataSource.getRepository(StockLayer);
  }

  /**
   * Transfer stock between warehouses/locations
   */
  async transferStock(input: StockTransferInput): Promise<StockMovement> {
    return await this.dataSource.transaction(async manager => {
      // Validate source has enough stock
      const sourceItem = await manager.findOne(InventoryItem, {
        where: {
          profileId: input.profileId,
          warehouseId: input.sourceWarehouseId,
          locationId: input.sourceLocationId || null,
          lotId: input.lotId || null,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceItem || sourceItem.quantityOnHand < input.quantity) {
        throw new AppError('Insufficient stock at source location', 400);
      }

      const previousQuantity = sourceItem.quantityOnHand;

      // Decrement source
      sourceItem.quantityOnHand -= input.quantity;
      sourceItem.quantityAvailable = sourceItem.quantityOnHand - sourceItem.quantityReserved;
      sourceItem.version += 1;
      sourceItem.lastMovementDate = new Date();
      await manager.save(sourceItem);

      // Create source movement (negative)
      const sourceMovement = manager.create(StockMovement, {
        profileId: input.profileId,
        warehouseId: input.sourceWarehouseId,
        locationId: input.sourceLocationId,
        lotId: input.lotId,
        movementType: MovementType.TRANSFER,
        quantity: -input.quantity,
        referenceType: 'TRANSFER',
        referenceId: 'OUT',
        performedBy: input.performedBy,
        performedAt: new Date(),
        ipAddress: input.ipAddress,
        previousQuantity,
        newQuantity: sourceItem.quantityOnHand,
        notes: `Transfer to warehouse ${input.destinationWarehouseId}. ${input.notes || ''}`,
      });
      await manager.save(sourceMovement);

      // Get or create destination item
      let destItem = await manager.findOne(InventoryItem, {
        where: {
          profileId: input.profileId,
          warehouseId: input.destinationWarehouseId,
          locationId: input.destinationLocationId || null,
          lotId: input.lotId || null,
        },
      });

      const destPreviousQuantity = destItem?.quantityOnHand || 0;

      if (!destItem) {
        destItem = manager.create(InventoryItem, {
          profileId: input.profileId,
          warehouseId: input.destinationWarehouseId,
          locationId: input.destinationLocationId,
          lotId: input.lotId,
          quantityOnHand: input.quantity,
          quantityReserved: 0,
          quantityAvailable: input.quantity,
          version: 0,
        });
      } else {
        destItem.quantityOnHand += input.quantity;
        destItem.quantityAvailable = destItem.quantityOnHand - destItem.quantityReserved;
        destItem.version += 1;
      }
      destItem.lastMovementDate = new Date();
      await manager.save(destItem);

      // Create destination movement (positive)
      const destMovement = manager.create(StockMovement, {
        profileId: input.profileId,
        warehouseId: input.destinationWarehouseId,
        locationId: input.destinationLocationId,
        lotId: input.lotId,
        movementType: MovementType.TRANSFER,
        quantity: input.quantity,
        referenceType: 'TRANSFER',
        referenceId: 'IN',
        performedBy: input.performedBy,
        performedAt: new Date(),
        ipAddress: input.ipAddress,
        previousQuantity: destPreviousQuantity,
        newQuantity: destItem.quantityOnHand,
        notes: `Transfer from warehouse ${input.sourceWarehouseId}. ${input.notes || ''}`,
      });
      await manager.save(destMovement);

      return destMovement;
    });
  }

  /**
   * Get FIFO cost for a quantity issuance
   */
  async calculateFIFOCost(
    profileId: string,
    warehouseId: string,
    quantity: number
  ): Promise<{ layers: { layerId: string; quantity: number; unitCost: number }[]; totalCost: number }> {
    const layers = await this.layerRepo.find({
      where: {
        profileId,
        warehouseId,
        isExhausted: false,
      },
      order: { receiptDate: 'ASC' },
    });

    let remainingToConsume = quantity;
    const consumedLayers: { layerId: string; quantity: number; unitCost: number }[] = [];
    let totalCost = 0;

    for (const layer of layers) {
      if (remainingToConsume <= 0) break;

      const consumeFromLayer = Math.min(remainingToConsume, layer.remainingQuantity);
      consumedLayers.push({
        layerId: layer.id,
        quantity: consumeFromLayer,
        unitCost: layer.unitCost,
      });
      totalCost += consumeFromLayer * layer.unitCost;
      remainingToConsume -= consumeFromLayer;
    }

    if (remainingToConsume > 0) {
      throw new AppError('Insufficient stock in FIFO layers', 400);
    }

    return { layers: consumedLayers, totalCost };
  }
}
```

---

## 4. Environment Variables

Add to `backend/.env`:

```env
# Stock Module Configuration
STOCK_FIFO_VALUATION=true
STOCK_ALERT_CHECK_INTERVAL=900000
STOCK_QUARANTINE_SLA_HOURS=48
STOCK_DEFAULT_MINIMUM_THRESHOLD=10
STOCK_COUNT_NUMBER_PREFIX=IC
```

---

## 5. Setup Steps

### 1. Create Default Warehouse

```sql
INSERT INTO warehouses (code, name, address, contact_name, contact_email, is_active)
VALUES ('MAIN', 'Main Warehouse', '123 Rue de l''Industrie, 75001 Paris', 'Stock Manager', 'stock@erp.local', true);
```

### 2. Seed Storage Locations

```typescript
// src/seeds/StockLocations.ts
import { DataSource } from 'typeorm';
import { StorageLocation } from '../models/stock/StorageLocation';

export async function seedStorageLocations(dataSource: DataSource): Promise<void> {
  const locationRepo = dataSource.getRepository(StorageLocation);
  
  const locations = [
    { zone: 'A', rack: 'R01', aisle: 'A1', level: 'L1' },
    { zone: 'A', rack: 'R01', aisle: 'A1', level: 'L2' },
    { zone: 'A', rack: 'R02', aisle: 'A2', level: 'L1' },
    { zone: 'B', rack: 'R01', aisle: 'B1', level: 'GND' },
    { zone: 'Q', rack: 'R01', aisle: 'Q1', level: 'GND' }, // Quarantine
  ];

  for (const loc of locations) {
    const code = `MAIN-${loc.zone}-${loc.rack}-${loc.aisle}-${loc.level}`;
    const exists = await locationRepo.findOne({ where: { code } });
    if (!exists) {
      await locationRepo.save({
        warehouseId: 'MAIN-WAREHOUSE-UUID', // Replace with actual warehouse ID
        zone: loc.zone,
        rack: loc.rack,
        aisle: loc.aisle,
        level: loc.level,
        code,
        isActive: true,
      });
    }
  }
}
```

### 3. Register Routes

Update `src/app.ts`:

```typescript
import { warehouseRouter } from './routes/stock/warehouse.routes';
import { inventoryRouter } from './routes/stock/inventory.routes';
import { lotRouter } from './routes/stock/lot.routes';
import { inventoryCountRouter } from './routes/stock/inventoryCount.routes';

// Add routes
app.use('/api/warehouses', authenticate, warehouseRouter);
app.use('/api/inventory', authenticate, inventoryRouter);
app.use('/api/lots', authenticate, lotRouter);
app.use('/api/inventory-counts', authenticate, inventoryCountRouter);
```

---

## 6. Running Tests

### Unit Tests

```bash
cd backend
npm test -- --testPathPattern=stock
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### Test Coverage Areas

1. **FIFO Calculation**: Verify correct cost layering
2. **Stock Transfers**: Verify quantity updates in both locations
3. **Lot Traceability**: Verify chain integrity
4. **Inventory Count Workflow**: Test all state transitions
5. **Concurrent Updates**: Test optimistic locking with version field
6. **Alert Thresholds**: Test trigger conditions

---

## 7. Key Implementation Notes

### Optimistic Locking

The [`InventoryItem`](specs/003-module-stock/data-model.md) entity uses a `version` field for optimistic locking. Always increment and check this on updates:

```typescript
const result = await inventoryRepo.update(
  { id: itemId, version: expectedVersion },
  { 
    quantityOnHand: newQuantity,
    version: expectedVersion + 1 
  }
);

if (result.affected === 0) {
  throw new AppError('Concurrent modification detected', 409);
}
```

### FIFO Layer Consumption

When issuing stock, always consume from oldest layers first:

```typescript
// Get layers ordered by receipt date
const layers = await layerRepo.find({
  where: { profileId, warehouseId, isExhausted: false },
  order: { receiptDate: 'ASC' },
});

// Consume from oldest first
for (const layer of layers) {
  if (quantityToConsume <= 0) break;
  const consume = Math.min(quantityToConsume, layer.remainingQuantity);
  layer.remainingQuantity -= consume;
  if (layer.remainingQuantity === 0) {
    layer.isExhausted = true;
  }
  await layerRepo.save(layer);
  quantityToConsume -= consume;
}
```

### Lot Quality Status Validation

Before allocating stock, check quality status:

```typescript
if (lot.qualityStatus === LotQualityStatus.REJECTED) {
  throw new AppError('Cannot allocate from rejected lot', 400);
}

if (lot.qualityStatus === LotQualityStatus.QUARANTINE) {
  // Allow only if emergency flag set
  if (!allowQuarantineConsumption) {
    throw new AppError('Lot is in quarantine', 400);
  }
}
```

### Alert Threshold Checking

Implement a check after every stock movement:

```typescript
async function checkAlertThresholds(profileId: string, warehouseId?: string): Promise<void> {
  const alerts = await alertRepo.find({
    where: { 
      profileId, 
      isActive: true,
      ...(warehouseId && { warehouseId }),
    },
  });

  for (const alert of alerts) {
    const inventory = await inventoryRepo.findOne({
      where: { profileId, warehouseId: alert.warehouseId || warehouseId },
    });

    const available = inventory?.quantityAvailable || 0;
    
    if (available < alert.minimumThreshold) {
      if (!alert.isTriggered) {
        await triggerAlert(alert, 'BELOW_MINIMUM', available);
      }
    } else if (alert.maximumThreshold && available > alert.maximumThreshold) {
      if (!alert.isTriggered) {
        await triggerAlert(alert, 'ABOVE_MAXIMUM', available);
      }
    } else if (alert.isTriggered) {
      await resetAlert(alert);
    }
  }
}
```

### Inventory Count State Machine

Implement strict state transitions:

```typescript
const validTransitions: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['VARIANCE_REVIEW', 'DRAFT'],
  VARIANCE_REVIEW: ['ADJUSTMENT_APPROVED', 'IN_PROGRESS'],
  ADJUSTMENT_APPROVED: ['COMPLETED', 'VARIANCE_REVIEW'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(from: string, to: string): boolean {
  return validTransitions[from]?.includes(to) || false;
}
```

---

## 8. Frontend Integration

### Stock API Client

Create `frontend/src/services/stockApi.ts`:

```typescript
import api from './api';

export const stockApi = {
  // Warehouses
  getWarehouses: () => api.get('/warehouses'),
  createWarehouse: (data: any) => api.post('/warehouses', data),
  
  // Inventory
  getInventory: (params?: any) => api.get('/inventory', { params }),
  transferStock: (data: any) => api.post('/inventory/transfer', data),
  
  // Movements
  getMovements: (params?: any) => api.get('/movements', { params }),
  
  // Lots
  getLots: (params?: any) => api.get('/lots', { params }),
  getLotTraceability: (id: string) => api.get(`/lots/${id}/traceability`),
  
  // Inventory Counts
  getInventoryCounts: (params?: any) => api.get('/inventory-counts', { params }),
  createInventoryCount: (data: any) => api.post('/inventory-counts', data),
  submitCount: (id: string) => api.post(`/inventory-counts/${id}/submit`),
  approveAdjustments: (id: string, data: any) => api.post(`/inventory-counts/${id}/approve`, data),
};
```

---

**Quickstart Version**: 1.0.0 | **Last Updated**: 2026-03-04