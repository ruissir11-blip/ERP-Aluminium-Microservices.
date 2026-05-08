import { Router } from 'express';
import { WarehouseController } from '../controllers/stock/WarehouseController';
import { StorageLocationController } from '../controllers/stock/StorageLocationController';
import { InventoryItemController } from '../controllers/stock/InventoryItemController';
import { StockMovementController } from '../controllers/stock/StockMovementController';
import { StockAlertController } from '../controllers/stock/StockAlertController';
import { LotController } from '../controllers/stock/LotController';
import { InventoryCountController } from '../controllers/stock/InventoryCountController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all stock routes
router.use(authenticate);

// Initialize controllers
const warehouseController = new WarehouseController();
const locationController = new StorageLocationController();
const inventoryController = new InventoryItemController();
const movementController = new StockMovementController();
const alertController = new StockAlertController();
const lotController = new LotController();
const countController = new InventoryCountController();

// ===================
// WAREHOUSE ROUTES
// ===================
router.get('/warehouses', warehouseController.list.bind(warehouseController));
router.get('/warehouses/:id', warehouseController.getById.bind(warehouseController));
router.post('/warehouses', warehouseController.create.bind(warehouseController));
router.put('/warehouses/:id', warehouseController.update.bind(warehouseController));
router.delete('/warehouses/:id', warehouseController.deactivate.bind(warehouseController));
router.post('/warehouses/:id/reactivate', warehouseController.reactivate.bind(warehouseController));
router.get('/warehouses/:id/statistics', warehouseController.getStatistics.bind(warehouseController));

// ===================
// LOCATION ROUTES
// ===================
router.get('/locations', locationController.list.bind(locationController));
router.get('/locations/:id', locationController.getById.bind(locationController));
router.post('/locations', locationController.create.bind(locationController));
router.put('/locations/:id', locationController.update.bind(locationController));
router.delete('/locations/:id', locationController.deactivate.bind(locationController));

// ===================
// INVENTORY ROUTES
// ===================
router.get('/inventory', inventoryController.list.bind(inventoryController));
router.get('/inventory/low-stock', inventoryController.getLowStock.bind(inventoryController));
router.get('/inventory/value', inventoryController.getTotalValue.bind(inventoryController));
router.get('/inventory/:id', inventoryController.getById.bind(inventoryController));
router.post('/inventory', inventoryController.create.bind(inventoryController));
router.put('/inventory/:id', inventoryController.update.bind(inventoryController));
router.post('/inventory/:id/adjust', inventoryController.adjust.bind(inventoryController));
router.post('/inventory/:id/transfer', inventoryController.transfer.bind(inventoryController));

// ===================
// MOVEMENT ROUTES
// ===================
router.get('/movements', movementController.list.bind(movementController));
router.post('/movements', movementController.create.bind(movementController));
router.get('/movements/:id', movementController.getById.bind(movementController));
router.get('/movements/history/:profileId/:warehouseId', movementController.getHistory.bind(movementController));
router.get('/movements/summary/:profileId/:warehouseId', movementController.getSummary.bind(movementController));
router.get('/movements/rotation/:profileId', movementController.getRotation.bind(movementController));

// ===================
// ALERT ROUTES
// ===================
router.get('/alerts', alertController.list.bind(alertController));
router.get('/alerts/active', alertController.getActive.bind(alertController));
router.get('/alerts/:id', alertController.getById.bind(alertController));
router.post('/alerts', alertController.create.bind(alertController));
router.put('/alerts/:id', alertController.update.bind(alertController));
router.delete('/alerts/:id', alertController.deactivate.bind(alertController));
router.post('/alerts/:id/acknowledge', alertController.acknowledge.bind(alertController));
router.post('/alerts/check', alertController.checkAlerts.bind(alertController));

// ===================
// LOT ROUTES
// ===================
router.get('/lots', lotController.list.bind(lotController));
router.get('/lots/expiring', lotController.getExpiring.bind(lotController));
router.get('/lots/:id', lotController.getById.bind(lotController));
router.get('/lots/:id/traceability', lotController.getTraceability.bind(lotController));
router.post('/lots', lotController.create.bind(lotController));
router.put('/lots/:id', lotController.update.bind(lotController));
router.patch('/lots/:id/quality-status', lotController.updateQualityStatus.bind(lotController));

// ===================
// INVENTORY COUNT ROUTES
// ===================
router.get('/inventory-counts', countController.list.bind(countController));
router.get('/inventory-counts/:id', countController.getById.bind(countController));
router.get('/inventory-counts/:id/lines', countController.getLines.bind(countController));
router.get('/inventory-counts/:id/statistics', countController.getStatistics.bind(countController));
router.post('/inventory-counts', countController.create.bind(countController));
router.post('/inventory-counts/:id/start', countController.start.bind(countController));
router.post('/inventory-counts/:id/submit', countController.submitForReview.bind(countController));
router.post('/inventory-counts/:id/approve', countController.approve.bind(countController));
router.post('/inventory-counts/:id/complete', countController.complete.bind(countController));
router.post('/inventory-counts/:id/cancel', countController.cancel.bind(countController));
router.post('/inventory-counts/:id/lines/:lineId', countController.recordCount.bind(countController));

export default router;
