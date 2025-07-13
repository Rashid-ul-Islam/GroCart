import express from "express";
import {
    getProductCount,
    getUserCount,
    getDashboardStats,
    getProducts,
    getCategories,
    searchProducts,
    deleteProduct,
    getProductById,
    updateProduct,
    getProductImages
} from "../controllers/adminPanelController.js";

const router = express.Router();

router.get("/getProductCount", getProductCount);
router.get("/getUserCount", getUserCount);
router.get("/getDashboardStats", getDashboardStats);

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', updateProduct);
router.get('/products/:id/images', getProductImages);
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.delete('/products/:id', deleteProduct);

export default router;
