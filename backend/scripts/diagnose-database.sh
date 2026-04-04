#!/bin/bash
# ==============================================================================
# ERP Aluminium - Database Diagnostic & Fix Script
# ==============================================================================
# Purpose: Fix dual PostgreSQL issue and verify all tables are accessible
# Usage: Run this script from the backend directory
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_aluminium}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "=============================================="
echo "  ERP Aluminium - Database Diagnostic Tool"
echo "=============================================="
echo ""

# Function to check if Docker is available
check_docker() {
    echo -e "${BLUE}[INFO]${NC} Checking Docker availability..."
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Docker is available"
        return 0
    else
        echo -e "${YELLOW}[WARN]${NC} Docker not found in PATH"
        return 1
    fi
}

# Function to check running PostgreSQL containers
check_postgres_containers() {
    echo ""
    echo -e "${BLUE}[STEP 1]${NC} Checking PostgreSQL containers..."
    echo "----------------------------------------------"
    
    if ! check_docker; then
        echo -e "${YELLOW}[WARN]${NC} Skipping Docker checks"
        return 1
    fi
    
    echo "Running PostgreSQL containers:"
    docker ps --filter "ancestor=postgres" --filter "ancestor=timescale/timescaledb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers found"
    
    echo ""
    echo "Checking for containers on port 5432 and 5433:"
    echo ""
    
    # Check for containers exposing port 5432
    PORT_5432=$(docker ps --format "{{.Names}}" | grep -E "$(docker ps --format "{{.Names}}" | xargs -I {} docker port {} 5432/tcp 2>/dev/null | grep -E '5432$' | cut -d: -f1 | head -1)" 2>/dev/null || echo "")
    
    # Alternative: Check which containers expose PostgreSQL ports
    docker ps --format "{{.Names}}:{{.Ports}}" | grep -E "5432|5433" || echo "No PostgreSQL on ports 5432/5433 found"
}

# Function to check PostgreSQL connection
check_postgres_connection() {
    echo ""
    echo -e "${BLUE}[STEP 2]${NC} Testing PostgreSQL connection..."
    echo "----------------------------------------------"
    
    # Try to connect using psql or docker exec
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" 2>/dev/null && echo -e "${GREEN}[OK]${NC} Connected to PostgreSQL on port $DB_PORT" || echo -e "${RED}[ERROR]${NC} Cannot connect to PostgreSQL on port $DB_PORT"
    elif check_docker; then
        # Try using docker exec with postgres container
        CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "postgres|erp" | head -1)
        if [ -n "$CONTAINER" ]; then
            echo "Trying to connect via container: $CONTAINER"
            docker exec -it "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" 2>/dev/null && echo -e "${GREEN}[OK]${NC} Connected" || echo -e "${RED}[ERROR]${NC} Cannot connect"
        fi
    fi
}

# Function to list all tables
list_tables() {
    echo ""
    echo -e "${BLUE}[STEP 3]${NC} Listing all tables in database..."
    echo "----------------------------------------------"
    
    if command -v psql &> /dev/null; then
        echo "Tables in public schema:"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || echo "Failed to list tables"
    elif check_docker; then
        CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "postgres|erp" | head -1)
        if [ -n "$CONTAINER" ]; then
            docker exec -it "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || echo "Failed to list tables"
        fi
    fi
}

# Function to verify HR tables specifically
verify_hr_tables() {
    echo ""
    echo -e "${BLUE}[STEP 4]${NC} Verifying HR module tables..."
    echo "----------------------------------------------"
    
    HR_TABLES=("employees" "departments" "postes" "employee_contracts" "leave_requests" "attendances" "payslips")
    
    if command -v psql &> /dev/null; then
        for table in "${HR_TABLES[@]}"; do
            EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null | xargs)
            if [ "$EXISTS" = "t" ]; then
                echo -e "  $table: ${GREEN}EXISTS${NC}"
            else
                echo -e "  $table: ${RED}MISSING${NC}"
            fi
        done
    fi
}

# Function to verify AI tables
verify_ai_tables() {
    echo ""
    echo -e "${BLUE}[STEP 5]${NC} Verifying AI module tables..."
    echo "----------------------------------------------"
    
    AI_TABLES=("ai_model" "ai_forecast" "ai_stockout_prediction" "ai_inventory_optimization" "ai_production_schedule")
    
    if command -v psql &> /dev/null; then
        for table in "${AI_TABLES[@]}"; do
            EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null | xargs)
            if [ "$EXISTS" = "t" ]; then
                echo -e "  $table: ${GREEN}EXISTS${NC}"
            else
                echo -e "  $table: ${RED}MISSING${NC}"
            fi
        done
    fi
}

# Function to check migrations
check_migrations() {
    echo ""
    echo -e "${BLUE}[STEP 6]${NC} Checking executed migrations..."
    echo "----------------------------------------------"
    
    if command -v psql &> /dev/null; then
        echo "Migration history:"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, name, timestamp from migrations ORDER BY timestamp;" 2>/dev/null || echo "No migrations table found or empty"
    fi
}

# Function to run migrations (if needed)
run_migrations() {
    echo ""
    echo -e "${BLUE}[STEP 7]${NC} Running pending migrations..."
    echo "----------------------------------------------"
    
    cd backend
    
    if [ -f "package.json" ]; then
        echo "Checking for pending migrations..."
        # The actual migration command would be run by the user
        echo -e "${YELLOW}[INFO]${NC} To run migrations, execute: npm run migration:run"
        echo -e "${YELLOW}[INFO]${NC} To see pending migrations, execute: npm run migration:show"
    else
        echo -e "${RED}[ERROR]${NC} Not in backend directory"
    fi
}

# Function to provide fix recommendations
provide_fix_recommendations() {
    echo ""
    echo -e "${BLUE}[DIAGNOSIS]${NC} Summary and Recommendations"
    echo "=============================================="
    echo ""
    echo "If you only see AI tables (ai_*), the likely causes are:"
    echo ""
    echo "  1. Connected to wrong PostgreSQL instance (port 5433 instead of 5432)"
    echo "  2. Migrations not yet executed for HR module"
    echo "  3. Using different database than 'erp_aluminium'"
    echo ""
    echo "To fix the dual PostgreSQL issue:"
    echo ""
    echo "  Option A - Use main PostgreSQL (recommended):"
    echo "    - Ensure you're connecting to port 5432"
    echo "    - Update your database client to connect to localhost:5432"
    echo ""
    echo "  Option B - Stop redundant PostgreSQL container:"
    echo "    - docker ps (find containers on port 5433)"
    echo "    - docker stop <container-id>"
    echo "    - docker rm <container-id>"
    echo ""
    echo "  Option C - Run migrations (if tables missing):"
    echo "    - cd backend"
    echo "    - npm run migration:run"
    echo ""
}

# Main execution
main() {
    check_postgres_containers
    check_postgres_connection
    list_tables
    verify_hr_tables
    verify_ai_tables
    check_migrations
    run_migrations
    provide_fix_recommendations
    
    echo ""
    echo "=============================================="
    echo "  Diagnostic Complete"
    echo "=============================================="
}

main "$@"