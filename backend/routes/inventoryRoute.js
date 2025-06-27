import  express from 'express';
import { getInventory, getInventoryStats, getProductInventory, getWarehouseInventory,
    upsertInventory,updateReorderLevel,restockInventory,deleteInventoryItem, getAllProducts
 } from '../controllers/inventoryController.js';

const router = express.Router();

// Inventory routes
router.get('/getInventory', getInventory);
router.get('/stats', getInventoryStats);
router.get('/product/:product_id', getProductInventory);
router.get('/warehouse/:warehouse_id', getWarehouseInventory);
router.post('/upInventory', upsertInventory);
router.put('/reorder-level/:inventory_id', updateReorderLevel);
router.post('/restock/:inventory_id', restockInventory);
router.delete('/inv/:inventory_id', deleteInventoryItem);
router.get('/getProducts', getAllProducts);
router.put('/upInventory', upsertInventory);


export default router;