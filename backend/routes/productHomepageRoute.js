import express from 'express';
import {
  getProductsForHomepage,
  getProductsBySection,
  getCategories,
  searchProducts,
  getProductById
} from '../controllers/productHomepageController.js';

const router = express.Router();

router.get('/getProductsForHomepage', getProductsForHomepage);

// Get products by section with pagination and filters
router.get('/section/:section', getProductsBySection);

// Get all categories
router.get('/categories', getCategories);

// Search products
router.get('/search', searchProducts);

// Get product details by ID
router.get('/:productId', getProductById);

export default router;