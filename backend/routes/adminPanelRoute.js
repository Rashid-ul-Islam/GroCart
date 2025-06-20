import express from "express";
import {
    getProductCount,
    getUserCount,
    getDashboardStats,
    getProducts,
    getCategories,
    searchProducts,
    deleteProduct
} from "../controllers/adminPanelController.js";

const router = express.Router();

router.get("/getProductCount", getProductCount);
router.get("/getUserCount", getUserCount);
router.get("/getDashboardStats", getDashboardStats);

// Product management routes
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.delete('/products/:id', deleteProduct);

export default router;
