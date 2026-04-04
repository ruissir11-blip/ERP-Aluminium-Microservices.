#!/bin/sh
set -e

echo "🚀 Starting ERP Aluminium Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🗄️ Running database migrations..."
cd /app

# Check if running in development mode with ts-node-dev
if [ "$NODE_ENV" = "development" ]; then
    echo "📝 Running in development mode - skipping build"
    # For development, ts-node-dev handles TypeScript directly
    exec "$@"
else
    # Production mode - ensure build exists
    if [ ! -d "dist" ]; then
        echo "🏗️ Building application..."
        npm run build
    fi

    # Run migrations
    echo "📦 Running TypeORM migrations..."
    npm run migration:run || echo "⚠️ Migration failed or no migrations to run"

    # Start the application
    echo "🚀 Starting production server..."
    exec npm start
fi
