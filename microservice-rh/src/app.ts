import 'reflect-metadata';
import { Request, Response } from 'express';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import { initializeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler'; // TODO: create minimal or copy shared
import { apiRateLimiter } from './middleware/rateLimiter'; // TODO: minimal
import { auditMiddleware } from './middleware/audit'; // Optional
import { sanitizationMiddleware } from './middleware/sanitization';
import { requestIdMiddleware } from './middleware/requestId';

// Import HR routes
import hrRoutes from './routes/index';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = '/api/v1';

// Security middleware
app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API-only
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiRateLimiter);

// Audit & sanitization (minimal)
app.use(sanitizationMiddleware());

// Health check for HR microservice
app.get('/health', async (req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'erp-rh-service',
    version: '1.0.0',
    schema: process.env.DB_SCHEMA || 'rh_schema',
  };

  try {
    const { AppDataSource } = await import('./config/database');
    if (AppDataSource.isInitialized) {
      await AppDataSource.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = '${process.env.DB_SCHEMA || 'rh_schema'}' LIMIT 1`);
      health.database = 'healthy';
    }
  } catch (error) {
    health.database = 'unhealthy';
    health.status = 'degraded';
  }

  res.status(200).json(health);
});

// HR API Routes
app.use(`${API_PREFIX}/hr`, hrRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize and start server
const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 RH Microservice running on port ${PORT}`);
      console.log(`📚 HR API: http://localhost:${PORT}${API_PREFIX}/hr`);
    });
  } catch (error) {
    console.error('Failed to start RH microservice:', error);
    process.exit(1);
  }
};

void startServer();

export default app;

