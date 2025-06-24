import express from 'express';
import {
  getProductsForHomepage
} from '../controllers/productHomepageController.js';

const router = express.Router();

router.get('/getProductsForHomepage', getProductsForHomepage);

export default router;