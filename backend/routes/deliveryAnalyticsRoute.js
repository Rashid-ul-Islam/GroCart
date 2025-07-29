import express from "express";
import {
    getDeliveryMetrics,
    getDailyDeliveryTrends,
    getRegionalDistribution,
    getPerformanceTrends,
    getTopPerformers,
    getRegionalScatterData
} from "../controllers/deliveryAnalyticsController.js";

const router = express.Router();

// Analytics routes
router.get("/metrics", getDeliveryMetrics);
router.get("/daily-trends", getDailyDeliveryTrends);
router.get("/regional-distribution", getRegionalDistribution);
router.get("/performance-trends", getPerformanceTrends);
router.get("/top-performers", getTopPerformers);
router.get('/regional-scatter', getRegionalScatterData);

export default router;
