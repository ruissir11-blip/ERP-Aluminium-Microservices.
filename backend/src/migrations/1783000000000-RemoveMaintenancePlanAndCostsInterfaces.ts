import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMaintenancePlanAndCostsInterfaces1783000000000 implements MigrationInterface {
  name = 'RemoveMaintenancePlanAndCostsInterfaces1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove FK from work_orders -> maintenance_plans if present
    await queryRunner.query(`
      ALTER TABLE "work_orders"
      DROP CONSTRAINT IF EXISTS "fk_work_orders_plan"
    `);

    // Drop maintenance_plan_id column from work_orders if present
    await queryRunner.query(`
      ALTER TABLE "work_orders"
      DROP COLUMN IF EXISTS "maintenance_plan_id"
    `);

    // Drop indexes on maintenance_plans if they exist
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_maint_plans_machine"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_maint_plans_next_due"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_maint_plans_active"`);

    // Drop maintenance_plans table
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_plans"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate maintenance_plans table
    await queryRunner.query(`
      CREATE TABLE "maintenance_plans" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "machine_id" uuid NOT NULL,
        "description" text NOT NULL,
        "task_type" character varying(255) NOT NULL,
        "frequency" character varying(50) NOT NULL,
        "frequency_days" integer,
        "estimated_duration_hours" numeric(6,2),
        "next_due_date" date,
        "last_completed_date" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "assigned_technician_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenance_plans_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_maint_plans_machine" ON "maintenance_plans" ("machine_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_maint_plans_next_due" ON "maintenance_plans" ("next_due_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_maint_plans_active" ON "maintenance_plans" ("is_active")
    `);

    await queryRunner.query(`
      ALTER TABLE "maintenance_plans"
      ADD CONSTRAINT "fk_maint_plans_machine"
      FOREIGN KEY ("machine_id") REFERENCES "machines"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Recreate maintenance_plan_id on work_orders
    await queryRunner.query(`
      ALTER TABLE "work_orders"
      ADD COLUMN "maintenance_plan_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "work_orders"
      ADD CONSTRAINT "fk_work_orders_plan"
      FOREIGN KEY ("maintenance_plan_id") REFERENCES "maintenance_plans"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }
}
