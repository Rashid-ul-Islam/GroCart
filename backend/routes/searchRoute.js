import express from 'express';
import { 
  searchProducts, 
  saveSearchHistory, 
  getUserSearchHistory 
} from '../controllers/searchController.js';

const router = express.Router();

router.get('/searchProducts', searchProducts);
router.post('/saveSearchHistory', saveSearchHistory);
router.get('/getUserSearchHistory/:userId', getUserSearchHistory);

export default router;
