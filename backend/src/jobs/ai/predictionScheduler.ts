import cron from 'node-cron';
import axios from 'axios';
import { AppDataSource } from '../../config/database';
import { AIStockoutPrediction, RiskLevel } from '../../models/ai';
import { InventoryItem, StockMovement } from '../../models/stock';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Scheduler for hourly stockout predictions
export function startPredictionScheduler() {
  console.log('Starting AI prediction scheduler...');
  
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly stockout prediction job...');
    await runStockoutPredictions();
  });
  
  // Also run at midnight for daily forecasts
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily demand forecast job...');
    await runDailyForecasts();
  });
  
  console.log('AI prediction scheduler started');
}

async function runStockoutPredictions() {
  try {
    const dataSource = AppDataSource;
    
    // Get all active inventory items
    const inventoryItems = await dataSource.getRepository(InventoryItem).find({
      where: { isActive: true }
    });
    
    for (const item of inventoryItems) {
      // Calculate average daily consumption
      const movements = await dataSource.getRepository(StockMovement).query(`
        SELECT AVG(ABS(quantity)) as avg_consumption
        FROM stock_movements
        WHERE inventory_item_id = $1
        AND movement_type = 'OUT'
        AND created_at >= NOW() - INTERVAL '30 days'
      `, [item.id]);
      
      const avgConsumption = movements[0]?.avg_consumption ? parseFloat(movements[0].avg_consumption) : 10;
      const leadTimeDays = 7; // Default
      
      // Call AI service for prediction
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/stockout/predict`, {
          inventory_item_id: item.id,
          days_horizon: 30
        }, { timeout: 10000 });
        
        const prediction = response.data;
        
        // Save prediction to database
        const predictionRepo = dataSource.getRepository(AIStockoutPrediction);
        
        const newPrediction = predictionRepo.create({
          inventoryItemId: item.id,
          predictionDate: new Date(),
          currentStock: Number(item.quantityOnHand) || 0,
          predictedConsumption: avgConsumption,
          daysToStockout: prediction.risk_summary.days_until_stockout || null,
          riskLevel: prediction.risk_summary.risk_level || RiskLevel.LOW,
          recommendedReorderQty: prediction.risk_summary.recommended_order_quantity || null,
          isAcknowledged: false
        });
        
        await predictionRepo.save(newPrediction);
        console.log(`Stockout prediction saved for item: ${item.id}`);
        
      } catch (err) {
        console.error(`Failed to predict stockout for item ${item.id}:`, err);
      }
    }
    
    console.log('Stockout prediction job completed');
    
  } catch (error) {
    console.error('Stockout prediction job failed:', error);
  }
}

async function runDailyForecasts() {
  try {
    // Get all active products from aluminium module
    const dataSource = AppDataSource;
    
    // Get distinct products from orders
    const products = await dataSource.query(`
      SELECT DISTINCT product_id 
      FROM customer_orders 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      LIMIT 50
    `);
    
    for (const product of products) {
      try {
        await axios.post(`${AI_SERVICE_URL}/forecast/generate`, {
          product_id: product.product_id,
          horizon: 12,
          confidence_level: 0.95
        }, { timeout: 30000 });
        
        console.log(`Forecast generated for product: ${product.product_id}`);
        
      } catch (err) {
        console.error(`Failed to generate forecast for product ${product.product_id}:`, err);
      }
    }
    
    console.log('Daily forecast job completed');
    
  } catch (error) {
    console.error('Daily forecast job failed:', error);
  }
}

export default {
  startPredictionScheduler,
  runStockoutPredictions,
  runDailyForecasts
};
