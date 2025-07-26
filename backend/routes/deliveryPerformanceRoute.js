import express from 'express';
import {
  getWeeklyPerformance,
  getPerformanceSummary,
  getRatingDistribution,
  getMonthlyPerformance,
  getPerformanceInsights
} from '../controllers/deliveryPerformanceController.js';

const router = express.Router();

// Get weekly performance data for charts
router.get('/weekly/:deliveryBoyId', getWeeklyPerformance);

// Get summary statistics (total deliveries, avg rating, etc.)
router.get('/summary/:deliveryBoyId', getPerformanceSummary);

// Get rating distribution for pie chart
router.get('/rating-distribution/:deliveryBoyId', getRatingDistribution);

// Get monthly performance data for bar chart
router.get('/monthly/:deliveryBoyId', getMonthlyPerformance);

// Get performance insights
router.get('/insights/:deliveryBoyId', getPerformanceInsights);

export default router;
