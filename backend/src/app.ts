import 'reflect-metadata';
import { Request, Response } from 'express';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import { initializeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { auditMiddleware } from './middleware/audit';
import { sanitizationMiddleware } from './middleware/sanitization';
import { requestIdMiddleware } from './middleware/requestId';
import { setupSwagger } from './config/swagger';
import register from './config/metrics';

// Import routes
import authRoutes from './routes/auth.routes';
import auditRoutes from './routes/audit.routes';
import userRoutes from './routes/users.routes';
import roleRoutes from './routes/roles.routes';
import profileRoutes from './routes/aluminium/profiles.routes';
import quoteRoutes from './routes/aluminium/quotes.routes';
import invoiceRoutes from './routes/aluminium/invoices.routes';
import customerRoutes from './routes/aluminium/customers.routes';
import orderRoutes from './routes/aluminium/orders.routes';
import stockRoutes from './routes/stock.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import databaseRoutes from './routes/database.routes';
import dashboardRoutes from './routes/dashboard.routes';
import qualityRoutes from './routes/quality.routes';
import comptabiliteRoutes from './routes/comptabilite.routes';
import biRoutes from './routes/bi.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Security middleware
app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || (() => { throw new Error('FRONTEND_URL is required in production'); })())
    : true, // Allow all origins in development
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiRateLimiter);

// Audit logging middleware (T075)
app.use(auditMiddleware());

// Input sanitization middleware (T087)
app.use(sanitizationMiddleware());

// Health check endpoint with database and Redis connectivity check
app.get('/health', async (req: Request, res: Response): Promise<void> => {
  interface HealthStatus {
    status: string;
    timestamp: string;
    version: string;
    services: {
      database: string;
      redis: string;
    };
  }

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database connectivity
    const { AppDataSource } = await import('./config/database');
    if (AppDataSource?.isInitialized) {
      await AppDataSource.query('SELECT 1');
      health.services.database = 'healthy';
    } else {
      health.services.database = 'not_initialized';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Check Redis connectivity
    const redisModule = await import('./config/redis');
    const redisClient = redisModule.default;
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.ping();
      health.services.redis = 'healthy';
    } else {
      health.services.redis = 'not_ready';
    }
  } catch (error) {
    health.services.redis = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// T086: Setup Swagger API documentation
setupSwagger(app);

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);

// Aluminum Module Routes
app.use(`${API_PREFIX}/profiles`, profileRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/quotes`, quoteRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);

// Stock Module Routes
app.use(`${API_PREFIX}/stock`, stockRoutes);

// Maintenance Module Routes
app.use(`${API_PREFIX}/maintenance`, maintenanceRoutes);

// Database Routes (Direct PostgreSQL access)
app.use(`${API_PREFIX}/database`, databaseRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Quality Module Routes
app.use(`${API_PREFIX}/quality`, qualityRoutes);

// Comptabilité Analytique Module Routes
app.use(`${API_PREFIX}/comptabilite`, comptabiliteRoutes);

// BI Dashboards Module Routes
app.use(`${API_PREFIX}/bi`, biRoutes);



// Handle favicon.ico requests to prevent 404 errors
// This must be before static files and the catch-all route
app.get('/favicon.ico', (req: Request, res: Response) => {
  // Return a 1x1 transparent PNG as a minimal favicon (avoids network errors)
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEklEQVQ4jWNgGAWjYBSMgpEOAAR0AgT/Uf7hAAAAAElFTkSuQmCC',
    'base64'
  );
  res.set('Content-Type', 'image/x-icon');
  res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  res.send(transparentPng);
});

// Also handle Apple touch icons and other common favicon formats
app.get('/apple-touch-icon.png', (req: Request, res: Response) => {
  res.status(204).end();
});

app.get('/apple-touch-icon-precomposed.png', (req: Request, res: Response) => {
  res.status(204).end();
});

// Serve static frontend files from project root (must be after API routes)
app.use(express.static(path.join(__dirname, '../..'), {
  // Set default file to serve for directory requests
  index: ['index.html', 'index.htm'],
  // Set cache headers for static assets
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Serve index.html for all non-API routes (SPA support - must be last)
app.get('*', (req: Request, res: Response) => {
  // Only serve index.html if it's not an API request
  if (!req.path.startsWith(API_PREFIX)) {
    res.sendFile(path.join(__dirname, '../../index.html'));
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database (with fallback for development without DB)
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, running without persistence:', dbError);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = (signal: string): void => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close database connection
  // await AppDataSource.destroy();
  
  console.log('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
void startServer();

export default app;