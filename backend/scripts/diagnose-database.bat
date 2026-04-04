@echo off
REM ==============================================================================
REM ERP Aluminium - Database Diagnostic Script (Windows)
REM ==============================================================================
REM Purpose: Fix dual PostgreSQL issue and verify all tables are accessible
REM Usage: Run from the backend directory: scripts\diagnose-database.bat
REM ==============================================================================

setlocal enabledelayedexpansion

echo ==============================================
echo   ERP Aluminium - Database Diagnostic Tool
echo ==============================================
echo.

set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=erp_aluminium
set DB_USER=postgres
set DB_PASSWORD=postgres

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] psql not found in PATH. Trying Docker approach...
    goto :docker_check
)

echo [STEP 1] Testing PostgreSQL connection on port %DB_PORT%...
echo ----------------------------------------------
echo.

echo Trying to connect to PostgreSQL...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Connected to PostgreSQL on port %DB_PORT%
) else (
    echo [ERROR] Cannot connect to PostgreSQL on port %DB_PORT%
    echo Trying alternative connection methods...
)

echo.
echo [STEP 2] Listing all tables in database...
echo ----------------------------------------------
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\dt" 2>nul

echo.
echo [STEP 3] Verifying HR module tables...
echo ----------------------------------------------
for %%T in (employees departments postes employee_contracts leave_requests attendances payslips) do (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '%%T');" 2>nul | findstr /C:"t" >nul
    if !ERRORLEVEL! equ 0 (
        echo   %%T: EXISTS
    ) else (
        echo   %%T: MISSING
    )
)

echo.
echo [STEP 4] Verifying AI module tables...
echo ----------------------------------------------
for %%T in (ai_model ai_forecast ai_stockout_prediction ai_inventory_optimization ai_production_schedule) do (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '%%T');" 2>nul | findstr /C:"t" >nul
    if !ERRORLEVEL! equ 0 (
        echo   %%T: EXISTS
    ) else (
        echo   %%T: MISSING
    )
)

echo.
echo [STEP 5] Checking executed migrations...
echo ----------------------------------------------
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT id, name, timestamp from migrations ORDER BY timestamp LIMIT 20;" 2>nul
if %ERRORLEVEL% neq 0 (
    echo No migrations table found or empty
)

goto :end

:docker_check
echo.
echo [INFO] Checking Docker containers...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | findstr /I "postgres"
if %ERRORLEVEL% neq 0 (
    echo No PostgreSQL containers found
) else (
    echo.
    echo [INFO] Found PostgreSQL containers. To diagnose manually:
    echo   docker exec -it [container_name] psql -U postgres -d erp_aluminium -c "\dt"
)

:end
echo.
echo ==============================================
echo   Diagnostic Complete
echo ==============================================
echo.
echo If you only see AI tables (ai_*), the likely causes are:
echo   1. Connected to wrong PostgreSQL instance (port 5433 instead of 5432)
echo   2. Migrations not yet executed for HR module
echo   3. Using different database than 'erp_aluminium'
echo.
echo To fix the dual PostgreSQL issue:
echo   - Ensure you're connecting to port 5432
echo   - Check your database client configuration
echo   - Run migrations: npm run migration:run
echo.

endlocal