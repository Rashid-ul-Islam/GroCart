import express from 'express';
import {
    getWarehouseInventory,
    getDeliveryBoyWarehouse,
    checkDeliveryProductAvailability
} from '../controllers/warehouseInventoryController.js';

const router = express.Router();

// Get warehouse inventory
router.get('/warehouse/:warehouseId/inventory', getWarehouseInventory);

// Get delivery boy's assigned warehouse
router.get('/delivery-boy/:deliveryBoyId/warehouse', getDeliveryBoyWarehouse);

// Check product availability for delivery
router.get('/delivery/:deliveryId/product-availability', checkDeliveryProductAvailability);

export default router;