import express from 'express';
import {
  getKpiData,
  getRevenueData,
  getCategoryData,
  getDeliveryData,
  getTierData,
  getTopProducts,
  getInventoryData,
  getGrowthData,
  getMonthlySales,
  getOrderTrends,
  getAllStats
} from '../controllers/statsController.js';

const router = express.Router();

// Individual stat endpoints
router.get('/kpi', getKpiData);
router.get('/revenue-data', getRevenueData);
router.get('/categories', getCategoryData);
router.get('/delivery', getDeliveryData);
router.get('/tiers', getTierData);
router.get('/top-products', getTopProducts);
router.get('/inventory', getInventoryData);
router.get('/growth', getGrowthData);
router.get('/monthly-sales', getMonthlySales);
router.get('/order-trends', getOrderTrends);

// Comprehensive endpoint for all stats
router.get('/all', getAllStats);

export default router;