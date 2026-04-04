import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArchitectureModule0090000000000 implements MigrationInterface {
  name = 'ArchitectureModule0090000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // System Configuration Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        is_encrypted BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category)
    `);

    // API Audit Log Table (partitioned by month)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS api_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id UUID,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time_ms INTEGER NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        request_headers JSONB,
        request_body JSONB,
        response_body JSONB,
        error_message TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_log_user_id ON api_log(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_log_endpoint ON api_log(endpoint)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_log_status_code ON api_log(status_code)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_log_timestamp ON api_log(timestamp DESC)
    `);

    // Backup Record Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS backup_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        backup_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        file_path VARCHAR(1000) NOT NULL,
        file_size_bytes BIGINT,
        checksum VARCHAR(64),
        database_name VARCHAR(100) NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_by UUID REFERENCES users(id),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_record_status ON backup_record(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_record_backup_type ON backup_record(backup_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_record_created_at ON backup_record(created_at DESC)
    `);

    // Environment Configuration Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS environment_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        environment VARCHAR(20) NOT NULL,
        config_key VARCHAR(255) NOT NULL,
        config_value TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT FALSE,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(environment, config_key)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_environment_config_environment ON environment_config(environment)
    `);

    // Service Health Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_health (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL,
        version VARCHAR(50),
        uptime_seconds INTEGER,
        last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        response_time_ms INTEGER,
        error_count INTEGER DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_health_last_checked ON service_health(last_checked_at DESC)
    `);

    // Deployment Record Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deployment_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(50) NOT NULL,
        environment VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        commit_hash VARCHAR(40),
        branch VARCHAR(100),
        deployed_by UUID REFERENCES users(id),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        rollback_available BOOLEAN DEFAULT FALSE,
        previous_version VARCHAR(50),
        error_message TEXT,
        artifacts JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_record_version ON deployment_record(version)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_record_environment ON deployment_record(environment)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_record_status ON deployment_record(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_record_created_at ON deployment_record(created_at DESC)
    `);

    // Rate Limit Record Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        ip_address VARCHAR(45) NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 1,
        window_start TIMESTAMP WITH TIME ZONE NOT NULL,
        window_end TIMESTAMP WITH TIME ZONE NOT NULL,
        blocked_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON rate_limit_record(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_address ON rate_limit_record(ip_address)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_record(window_start)
    `);

    // Cache Configuration Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cache_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cache_key VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        ttl_seconds INTEGER NOT NULL DEFAULT 300,
        max_size_bytes BIGINT,
        strategy VARCHAR(20) NOT NULL DEFAULT 'TTL',
        enabled BOOLEAN DEFAULT TRUE,
        tags TEXT[],
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Migration Record Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migration_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        version VARCHAR(50) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        rolled_back_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        execution_time_ms INTEGER,
        error_message TEXT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_record_version ON migration_record(version)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_record_status ON migration_record(status)
    `);

    // Event Log Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        user_id UUID REFERENCES users(id),
        session_id UUID,
        resource_type VARCHAR(100),
        resource_id UUID,
        metadata JSONB,
        source VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_log_event_type ON event_log(event_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_log_event_category ON event_log(event_category)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_log_severity ON event_log(severity)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log(timestamp DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_log_user_id ON event_log(user_id)
    `);

    // Note: TimescaleDB is optional and skipped for basic PostgreSQL compatibility
    // If you need TimescaleDB features, install the extension manually:
    // CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

    // Insert default system configurations
    await queryRunner.query(`
      INSERT INTO system_config (key, value, category, is_public, description)
      VALUES 
        ('app.name', '"ERP Aluminium"', 'app', true, 'Application name'),
        ('app.version', '"1.0.0"', 'app', true, 'Application version'),
        ('app.timezone', '"Europe/Paris"', 'app', true, 'Application timezone'),
        ('app.locale', '"fr-FR"', 'app', true, 'Application locale'),
        ('security.jwt.expiry', '3600', 'security', false, 'JWT token expiry in seconds'),
        ('security.jwt.refresh_expiry', '604800', 'security', false, 'JWT refresh token expiry in seconds'),
        ('security.rate_limit.requests', '100', 'security', true, 'Rate limit requests per window'),
        ('security.rate_limit.window', '60', 'security', true, 'Rate limit window in seconds'),
        ('cache.default_ttl', '300', 'cache', true, 'Default cache TTL in seconds'),
        ('database.pool.min', '2', 'database', true, 'Minimum database connection pool size'),
        ('database.pool.max', '20', 'database', true, 'Maximum database connection pool size'),
        ('backup.retention.days', '30', 'backup', true, 'Backup retention in days'),
        ('backup.schedule', '"0 2 * * *"', 'backup', true, 'Backup schedule cron expression')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop event_log table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_log_event_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_log_event_category`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_log_severity`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_log_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_log_user_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_log`);

    // Drop migration_record table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_migration_record_version`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_migration_record_status`);
    await queryRunner.query(`DROP TABLE IF EXISTS migration_record`);

    // Drop cache_config table
    await queryRunner.query(`DROP TABLE IF EXISTS cache_config`);

    // Drop rate_limit_record table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_rate_limit_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_rate_limit_ip_address`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_rate_limit_window_start`);
    await queryRunner.query(`DROP TABLE IF EXISTS rate_limit_record`);

    // Drop deployment_record table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deployment_record_version`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deployment_record_environment`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deployment_record_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deployment_record_created_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS deployment_record`);

    // Drop service_health table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_health_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_health_last_checked`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_health`);

    // Drop environment_config table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_environment_config_environment`);
    await queryRunner.query(`DROP TABLE IF EXISTS environment_config`);

    // Drop backup_record table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_backup_record_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_backup_record_backup_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_backup_record_created_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS backup_record`);

    // Drop api_log table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_log_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_log_endpoint`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_log_status_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_log_timestamp`);
    await queryRunner.query(`DROP TABLE IF EXISTS api_log`);

    // Drop system_config table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_system_config_category`);
    await queryRunner.query(`DROP TABLE IF EXISTS system_config`);
  }
}
