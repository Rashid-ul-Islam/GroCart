import express from "express";
import {
  getDeliveryStats,
  getRecentOrders,
} from "../controllers/deliveryOverviewController.js";

const router = express.Router();

router.get("/stats", getDeliveryStats);
router.get("/recent-orders", getRecentOrders);

export default router;