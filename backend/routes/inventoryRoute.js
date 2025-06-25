import  express from 'express';
import { getInventory, getInventoryStats, getProductInventory, getWarehouseInventory,
    upsertInventory,updateReorderLevel,restockInventory,deleteInventoryItem
 } from '../controllers/inventoryController.js';

const router = express.Router();

// Inventory routes
router.get('/getInventory', getInventory);
router.get('/stats', getInventoryStats);
router.get('/product/:productId', getProductInventory);
router.get('/warehouse/:warehouseId', getWarehouseInventory);
router.post('/upInventory', upsertInventory);
router.put('/reorder-level/:inventoryId', updateReorderLevel);
router.post('/restock/:inventoryId', restockInventory);
router.delete('/inv/:id', deleteInventoryItem);

export default router;