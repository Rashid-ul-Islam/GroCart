import express from 'express';
import {
  getProductsByCategory,
    getProductsByCategoryRecursive,
    getAllProducts,
    getProductById,
    searchProducts
} from '../controllers/productsByCatController.js';

const router = express.Router();

router.get('/getProductsByCategory/:categoryId', getProductsByCategory);
router.get('/getProductsByCategoryRecursive/:categoryId', getProductsByCategoryRecursive);
router.get('/getAllProducts', getAllProducts);
router.get('/getProduct/:productId', getProductById);
router.get('/searchProducts', searchProducts);

export default router;