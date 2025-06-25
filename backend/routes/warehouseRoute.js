import express from "express";
import {
    getWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse} from "../controllers/warehouseController.js";
const router = express.Router();

// Warehouse routes
router.get("/warehouses", getWarehouses);
router.get("/warehouses/:id", getWarehouseById);
router.post("/warehouses", createWarehouse);
router.put("/warehouses/:id", updateWarehouse);

export default router;