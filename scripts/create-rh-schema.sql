-- RH Microservice Database Migration
-- Run this in erp_aluminium DB as postgres user

CREATE SCHEMA IF NOT EXISTS rh_schema;

-- Grant permissions
GRANT ALL ON SCHEMA rh_schema TO postgres;

-- Optional: Create dedicated RH user
-- CREATE ROLE rh_user WITH LOGIN PASSWORD 'rh_pass';
-- GRANT ALL ON SCHEMA rh_schema TO rh_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA rh_schema GRANT ALL ON TABLES TO rh_user;

-- TypeORM will create tables automatically in rh_schema when synchronize=true (dev only)
-- For production: npm run migration:generate && npm run migration:run in microservice-rh/

-- Verify
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'rh_schema';

