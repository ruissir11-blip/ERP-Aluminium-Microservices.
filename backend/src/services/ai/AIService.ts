import { Logger } from 'winston';
import {
    AIModel,
    AIModelType,
    AIModelStatus,
    AIForecast,
    AIStockoutPrediction,
    RiskLevel,
    AIInventoryOptimization,
} from '../../models/ai';
import { InventoryItem, StockMovement, MovementType } from '../../models/stock';
import { CustomerOrder } from '../../models/aluminium';
import { getRepository } from 'typeorm';
import Decimal from 'decimal.js';

export class AIService {
    private logger: Logger;

    constructor() {
        this.logger = require('../config/logger').default;
    }

    // ==================== Demand Forecasting ====================

    async generateForecast(productId: string, horizon: number = 12): Promise<AIForecast[]> {
        this.logger.info(`Generating forecast for product ${productId}, horizon ${horizon}`);

        // Get historical sales data
        const historicalData = await this.getHistoricalSales(productId, 24); // 24 months

        if (historicalData.length < 12) {
            this.logger.warn(`Insufficient data for product ${productId}`);
            return [];
        }

        // Simple moving average forecast (placeholder for ML model)
        const avgMonthlySales = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;

        // Generate forecasts for each week
        const forecasts: AIForecast[] = [];
        const today = new Date();

        for (let i = 1; i <= horizon; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + i * 7);

            // Simple forecast with confidence intervals
            const predictedQty = avgMonthlySales * (1 + (Math.random() - 0.5) * 0.2);
            const confidenceRange = predictedQty * 0.15;

            const forecast = getRepository(AIForecast).create({
                productId,
                forecastDate: today,
                targetDate,
                horizon: i,
                predictedQuantity: predictedQty,
                confidenceLower: predictedQty - confidenceRange,
                confidenceUpper: predictedQty + confidenceRange,
                confidenceLower80: predictedQty - confidenceRange * 0.7,
                confidenceUpper80: predictedQty + confidenceRange * 0.7,
                isManual: false,
            });

            forecasts.push(forecast);
        }

        return getRepository(AIForecast).save(forecasts);
    }

    private async getHistoricalSales(productId: string, months: number): Promise<number[]> {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const orders = await getRepository(CustomerOrder).find({
            where: {
                createdAt: require('typeorm').MoreThanOrEqual(startDate),
            },
            order: { createdAt: 'ASC' },
        });

        // Group by month and sum quantities
        const monthlySales: { [key: string]: number } = {};

        for (const order of orders) {
            const monthKey = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
            monthlySales[monthKey] = (monthlySales[monthKey] || 0) + Number(order.total || 0);
        }

        return Object.values(monthlySales);
    }

    async getForecastHistory(productId: string, startDate: Date, endDate: Date): Promise<AIForecast[]> {
        const { Between } = require('typeorm');
        return getRepository(AIForecast).find({
            where: {
                productId,
                targetDate: Between(startDate, endDate),
            },
            order: { targetDate: 'ASC' },
        });
    }

    // ==================== Stockout Prediction ====================

    async predictStockout(inventoryItemId: string): Promise<AIStockoutPrediction | null> {
        const item = await getRepository(InventoryItem).findOne({ where: { id: inventoryItemId } });
        if (!item) return null;

        const currentStock = Number(item.quantityOnHand || 0);
        const avgDailyConsumption = await this.getAverageDailyConsumption(inventoryItemId);

        if (avgDailyConsumption === 0) {
            return null;
        }

        const daysToStockout = currentStock / avgDailyConsumption;
        const pendingIncoming = await this.getPendingIncoming(inventoryItemId);

        let riskLevel: RiskLevel;
        if (daysToStockout <= 7) riskLevel = RiskLevel.CRITICAL;
        else if (daysToStockout <= 14) riskLevel = RiskLevel.HIGH;
        else if (daysToStockout <= 30) riskLevel = RiskLevel.MEDIUM;
        else riskLevel = RiskLevel.LOW;

        const prediction = getRepository(AIStockoutPrediction).create({
            inventoryItemId,
            predictionDate: new Date(),
            currentStock,
            predictedConsumption: avgDailyConsumption * 30,
            pendingIncoming,
            daysToStockout: Math.round(daysToStockout * 10) / 10,
            riskLevel,
            leadTimeDays: 7, // Default lead time
        });

        return getRepository(AIStockoutPrediction).save(prediction);
    }

    private async getAverageDailyConsumption(itemId: string): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get the inventory item to find its profileId
        const item = await getRepository(InventoryItem).findOne({ where: { id: itemId } });
        if (!item) return 0;
        
        const { MoreThanOrEqual } = require('typeorm');
        const movements = await getRepository(StockMovement).find({
            where: {
                profileId: item.profileId,
                movementType: MovementType.ISSUE,
                createdAt: MoreThanOrEqual(thirtyDaysAgo),
            },
        });

        const totalOutbound = movements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
        return totalOutbound / 30;
    }

    private async getPendingIncoming(itemId: string): Promise<number> {
        // Get the inventory item to find its profileId
        const item = await getRepository(InventoryItem).findOne({ where: { id: itemId } });
        if (!item) return 0;
        
        const movements = await getRepository(StockMovement).find({
            where: {
                profileId: item.profileId,
                movementType: MovementType.RECEIPT,
            },
        });

        return movements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    }

    async getStockoutRiskList(minRiskLevel: RiskLevel = RiskLevel.LOW): Promise<AIStockoutPrediction[]> {
        const riskLevels = [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW];
        const minIndex = riskLevels.indexOf(minRiskLevel);

        return getRepository(AIStockoutPrediction)
            .createQueryBuilder('prediction')
            .where('prediction.risk_level IN (:...levels)', {
                levels: riskLevels.slice(0, minIndex + 1),
            })
            .andWhere('prediction.is_acknowledged = :acknowledged', { acknowledged: false })
            .orderBy('prediction.days_to_stockout', 'ASC')
            .getMany();
    }

    // ==================== Inventory Optimization ====================

    async optimizeInventory(itemId: string): Promise<AIInventoryOptimization | null> {
        const item = await getRepository(InventoryItem).findOne({ where: { id: itemId } });
        if (!item) return null;

        // Get annual demand from forecast (simplified)
        const annualDemand = await this.getAnnualDemand(itemId);
        const unitCost = Number(item.averageUnitCost || 10);
        const orderingCost = 50; // Default ordering cost
        const holdingCostRate = 0.25; // 25% of unit cost per year

        // Calculate EOQ: sqrt(2 * D * S / H)
        const eoq = Math.sqrt((2 * annualDemand * orderingCost) / (unitCost * holdingCostRate));
        const roundedEoq = Math.ceil(eoq);

        // Calculate reorder point
        const leadTimeDays = 7;
        const avgDailyConsumption = annualDemand / 365;
        const safetyStock = 1.65 * avgDailyConsumption * Math.sqrt(leadTimeDays); // 95% service level
        const reorderPoint = (avgDailyConsumption * leadTimeDays) + safetyStock;

        // Calculate expected savings
        const currentOrderQty = Number(item.reorderQuantity || eoq);
        const currentAnnualCost = (annualDemand / currentOrderQty * orderingCost) + (currentOrderQty / 2 * unitCost * holdingCostRate);
        const optimizedAnnualCost = (annualDemand / roundedEoq * orderingCost) + (roundedEoq / 2 * unitCost * holdingCostRate);
        const expectedSavings = currentAnnualCost - optimizedAnnualCost;

        const optimization = getRepository(AIInventoryOptimization).create({
            inventoryItemId: itemId,
            calculationDate: new Date(),
            currentOrderQty,
            eoq: roundedEoq,
            reorderPoint: Math.round(reorderPoint * 100) / 100,
            safetyStock: Math.round(safetyStock * 100) / 100,
            minimumOrderQty: item.minimumOrderQuantity ? Number(item.minimumOrderQuantity) : undefined,
            annualDemand,
            orderingCost,
            holdingCostRate,
            unitCost,
            expectedAnnualSavings: Math.round(expectedSavings * 100) / 100,
            orderFrequency: Math.round(annualDemand / roundedEoq * 100) / 100,
            currentAnnualCost: Math.round(currentAnnualCost * 100) / 100,
            optimizedAnnualCost: Math.round(optimizedAnnualCost * 100) / 100,
        });

        return getRepository(AIInventoryOptimization).save(optimization);
    }

    private async getAnnualDemand(itemId: string): Promise<number> {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Get the inventory item to find its profileId
        const item = await getRepository(InventoryItem).findOne({ where: { id: itemId } });
        if (!item) return 0;
        
        const { MoreThanOrEqual } = require('typeorm');
        const movements = await getRepository(StockMovement).find({
            where: {
                profileId: item.profileId,
                movementType: MovementType.ISSUE,
                createdAt: MoreThanOrEqual(oneYearAgo),
            },
        });

        return movements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    }

    // ==================== Model Management ====================

    async createModel(name: string, type: AIModelType, algorithm: string): Promise<AIModel> {
        const model = getRepository(AIModel).create({
            name,
            type,
            algorithm,
            version: '1.0.0',
            status: AIModelStatus.TRAINING,
        });

        return getRepository(AIModel).save(model);
    }

    async getModels(type?: AIModelType, status?: AIModelStatus): Promise<AIModel[]> {
        const query = getRepository(AIModel).createQueryBuilder('model');

        if (type) {
            query.andWhere('model.type = :type', { type });
        }

        if (status) {
            query.andWhere('model.status = :status', { status });
        }

        return query.orderBy('model.created_at', 'DESC').getMany();
    }

    async deployModel(modelId: string): Promise<AIModel | null> {
        const model = await getRepository(AIModel).findOne({ where: { id: modelId } });
        if (!model) return null;

        // Archive currently deployed model of same type
        await getRepository(AIModel).update(
            { type: model.type, status: AIModelStatus.DEPLOYED },
            { status: AIModelStatus.ARCHIVED }
        );

        model.status = AIModelStatus.DEPLOYED;
        model.deployedAt = new Date();

        return getRepository(AIModel).save(model);
    }

    // ==================== Health Check ====================

    async healthCheck(): Promise<{ status: string; databaseConnected: boolean }> {
        try {
            await getRepository(AIModel).count();
            return {
                status: 'healthy',
                databaseConnected: true,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                databaseConnected: false,
            };
        }
    }
}
