import express from "express";
import {
    checkStockAvailability,
    reserveStock,
    releaseStock,
    getRealTimeStock,
    resetStuckStock,
    getStuckStock
} from "../controllers/stockController.js";

const router = express.Router();

// Check stock availability for cart items
router.post("/check-availability", checkStockAvailability);

// Reserve stock for items
router.post("/reserve", reserveStock);

// Release reserved stock
router.post("/release", releaseStock);

// Get real-time stock for products
router.get("/real-time", getRealTimeStock);

// Admin functions for stuck stock management
router.get("/stuck", getStuckStock);
router.post("/reset-stuck", resetStuckStock);

export default router;
