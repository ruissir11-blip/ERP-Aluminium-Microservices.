import { Router, Request, Response } from 'express';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Helper function to make requests to AI service
async function callAIService(method: string, path: string, body?: any): Promise<any> {
  const url = `${AI_SERVICE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`AI service error: ${response.statusText}`);
  }
  
  return response.json();
}

// ========== FORECAST ROUTES ==========

/**
 * POST /api/ai/forecast/generate
 * Generate demand forecast for a product
 */
router.post('/forecast/generate', async (req: Request, res: Response) => {
  try {
    const { product_id, horizon, include_confidence, confidence_level, model_type } = req.body;
    
    const data = await callAIService('POST', '/forecast/generate', {
      product_id,
      horizon: horizon || 12,
      include_confidence: include_confidence !== false,
      confidence_level: confidence_level || 0.95,
      model_type: model_type || 'auto'
    });
    
    res.json(data);
  } catch (error: any) {
    console.error('Forecast generation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate forecast',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/forecast/history/:productId
 * Get forecast history for a product
 */
router.get('/forecast/history/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;
    
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const path = `/forecast/history/${productId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const data = await callAIService('GET', path);
    
    res.json(data);
  } catch (error: any) {
    console.error('Forecast history error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch forecast history',
      details: error.message 
    });
  }
});

/**
 * POST /api/ai/forecast/override
 * Override automated forecast with manual value
 */
router.post('/forecast/override', async (req: Request, res: Response) => {
  try {
    const { product_id, forecast_date, manual_value } = req.body;
    
    const data = await callAIService('POST', `/forecast/override?product_id=${product_id}&forecast_date=${forecast_date}&manual_value=${manual_value}`);
    
    res.json(data);
  } catch (error: any) {
    console.error('Forecast override error:', error.message);
    res.status(500).json({ 
      error: 'Failed to apply forecast override',
      details: error.message 
    });
  }
});

// ========== STOCKOUT ROUTES ==========

/**
 * POST /api/ai/stockout/predict
 * Predict stockout risk for an inventory item
 */
router.post('/stockout/predict', async (req: Request, res: Response) => {
  try {
    const { inventory_item_id, days_horizon } = req.body;
    
    const data = await callAIService('POST', '/stockout/predict', {
      inventory_item_id,
      days_horizon: days_horizon || 30
    });
    
    res.json(data);
  } catch (error: any) {
    console.error('Stockout prediction error:', error.message);
    res.status(500).json({ 
      error: 'Failed to predict stockout',
      details: error.message 
    });
  }
});

/**
 * POST /api/ai/stockout/acknowledge
 * Acknowledge a stockout prediction
 */
router.post('/stockout/acknowledge', async (req: Request, res: Response) => {
  try {
    const { prediction_id, acknowledged_by } = req.body;
    
    const data = await callAIService('POST', `/stockout/acknowledge?prediction_id=${prediction_id}&acknowledged_by=${acknowledged_by}`);
    
    res.json(data);
  } catch (error: any) {
    console.error('Stockout acknowledge error:', error.message);
    res.status(500).json({ 
      error: 'Failed to acknowledge stockout',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/stockout/predictions
 * Get all stockout predictions
 */
router.get('/stockout/predictions', async (req: Request, res: Response) => {
  try {
    // Query from database directly using TypeORM
    const db = req.app.locals.db;
    
    const predictions = await db.query(`
      SELECT * FROM ai_stockout_predictions 
      WHERE is_acknowledged = false 
      ORDER BY probability DESC 
      LIMIT 50
    `);
    
    res.json({ predictions: predictions.rows });
  } catch (error: any) {
    console.error('Stockout predictions error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch predictions',
      details: error.message 
    });
  }
});

// ========== INVENTORY OPTIMIZATION ROUTES ==========

/**
 * POST /api/ai/inventory/optimize
 * Optimize inventory using EOQ
 */
router.post('/inventory/optimize', async (req: Request, res: Response) => {
  try {
    const { inventory_item_id, annual_demand, unit_cost, ordering_cost, holding_cost_rate, quantity_discounts } = req.body;
    
    const data = await callAIService('POST', '/inventory/optimize', {
      inventory_item_id,
      annual_demand,
      unit_cost,
      ordering_cost,
      holding_cost_rate: holding_cost_rate || 0.25,
      quantity_discounts
    });
    
    res.json(data);
  } catch (error: any) {
    console.error('Inventory optimization error:', error.message);
    res.status(500).json({ 
      error: 'Failed to optimize inventory',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/inventory/recommendations/:inventoryItemId
 * Get reorder recommendations
 */
router.get('/inventory/recommendations/:inventoryItemId', async (req: Request, res: Response) => {
  try {
    const { inventoryItemId } = req.params;
    
    const data = await callAIService('GET', `/inventory/recommendations/${inventoryItemId}`);
    
    res.json(data);
  } catch (error: any) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/inventory/optimizations
 * Get all inventory optimizations
 */
router.get('/inventory/optimizations', async (req: Request, res: Response) => {
  try {
    const db = req.app.locals.db;
    
    const optimizations = await db.query(`
      SELECT * FROM ai_inventory_optimization 
      ORDER BY calculation_date DESC 
      LIMIT 100
    `);
    
    res.json({ optimizations: optimizations.rows });
  } catch (error: any) {
    console.error('Optimizations error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch optimizations',
      details: error.message 
    });
  }
});

// ========== PRODUCTION SCHEDULING ROUTES ==========

/**
 * POST /api/ai/production/schedule
 * Generate production schedule
 */
router.post('/production/schedule', async (req: Request, res: Response) => {
  try {
    const { orders, machines, algorithm, constraints } = req.body;
    
    const data = await callAIService('POST', '/production/schedule', {
      orders,
      machines,
      algorithm: algorithm || 'genetic',
      constraints
    });
    
    res.json(data);
  } catch (error: any) {
    console.error('Production scheduling error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/production/schedule/:date
 * Get production schedule for a date
 */
router.get('/production/schedule/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    const data = await callAIService('GET', `/production/schedule/${date}`);
    
    res.json(data);
  } catch (error: any) {
    console.error('Schedule fetch error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch schedule',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/production/schedules
 * Get all production schedules
 */
router.get('/production/schedules', async (req: Request, res: Response) => {
  try {
    const db = req.app.locals.db;
    
    const schedules = await db.query(`
      SELECT * FROM ai_production_schedules 
      ORDER BY scheduled_start DESC 
      LIMIT 100
    `);
    
    res.json({ schedules: schedules.rows });
  } catch (error: any) {
    console.error('Schedules error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch schedules',
      details: error.message 
    });
  }
});

// ========== DATA EXTRACTION ROUTES ==========

/**
 * POST /api/ai/data/extract
 * Extract data from various modules
 */
router.post('/data/extract', async (req: Request, res: Response) => {
  try {
    const { module, entity, start_date, end_date, filters } = req.body;
    
    const data = await callAIService('POST', '/data/extract', {
      module,
      entity,
      start_date,
      end_date,
      filters
    });
    
    res.json(data);
  } catch (error: any) {
    console.error('Data extraction error:', error.message);
    res.status(500).json({ 
      error: 'Failed to extract data',
      details: error.message 
    });
  }
});

// ========== ML MODELS ROUTES ==========

/**
 * GET /api/ai/mlflow/models
 * List available ML models
 */
router.get('/mlflow/models', async (req: Request, res: Response) => {
  try {
    const data = await callAIService('GET', '/mlflow/models');
    res.json(data);
  } catch (error: any) {
    console.error('MLflow models error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch models',
      details: error.message 
    });
  }
});

// ========== HEALTH CHECK ==========

/**
 * GET /api/ai/health
 * AI service health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const data = await callAIService('GET', '/health');
    res.json(data);
  } catch (error: any) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'AI service not available'
    });
  }
});

export default router;
