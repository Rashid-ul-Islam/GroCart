// routes/analytics.js
import express from 'express';
import {
    getRevenueData,
    getKPIMetrics,
    getCategoryData,
    getDeliveryPerformance,
    getCustomerTiers,
    getTopProducts,
    getMonthlyGrowth,
    getInventoryStatus,
    getDashboardData
} from '../controllers/statsController.js';

const router = express.Router();

// Analytics routes
router.get('/revenue-data', getRevenueData);
router.get('/kpi-metrics', getKPIMetrics);
router.get('/category-data', getCategoryData);
router.get('/delivery-performance', getDeliveryPerformance);
router.get('/customer-tiers', getCustomerTiers);
router.get('/top-products', getTopProducts);
router.get('/monthly-growth', getMonthlyGrowth);
router.get('/inventory-status', getInventoryStatus);
router.get('/dashboard', getDashboardData);

export default router;