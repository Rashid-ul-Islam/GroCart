import express from "express";
import {
    getAssignedDeliveries,
    markDeliveryCompleted,
    reportDeliveryIssue,
    getDeliveryBoyProfile,
    getDeliveryBoyStats,
    getDeliveryPerformanceMetrics,
    getDeliveryReviews,
    getDeliveryBoyEarnings,
    getAssignedDeliveriesForDashboard,
    getDeliveryDashboardSummary,
    getDeliverySchedule,
    searchDeliveries,
    getWeeklyPerformance,
    getRealTimePerformanceMetrics,
    getPerformanceByPeriod,
    abortDelivery
} from "../controllers/assignedDeliveryController.js";

import {
    markProductsFetched,
    markDeliveryCompletedNew,
    rateCustomer,
    fixDeliveryStatusHistory,
    debugDeliveries,
    updatePendingDeliveriesToAssigned,
    updateDeliveryToAssigned
} from "../controllers/newDeliveryFunctions.js";

const router = express.Router();

// Assigned Delivery Routes
router.get("/getAssignedDeliveries/:delivery_boy_id", getAssignedDeliveries);

// New delivery workflow routes
router.put("/markProductsFetched/:delivery_id", markProductsFetched);
router.put("/markDeliveryCompletedNew/:delivery_id", markDeliveryCompletedNew);
router.post("/rateCustomer/:delivery_id", rateCustomer);

// Legacy routes (kept for backward compatibility)
router.put("/markDeliveryCompleted/:deliveryId", markDeliveryCompleted);
router.post("/reportDeliveryIssue/:deliveryId", reportDeliveryIssue);
router.get("/deliveryBoyProfile/:deliveryBoyId", getDeliveryBoyProfile);
router.get("/deliveryBoyStats/:user_id", getDeliveryBoyStats);
router.get("/deliveryPerformanceMetrics/:deliveryBoyId", getDeliveryPerformanceMetrics);
router.get("/deliveryReviews/:deliveryBoyId", getDeliveryReviews);
router.get("/deliveryBoyEarnings/:deliveryBoyId", getDeliveryBoyEarnings);
// Add these new routes
router.get("/assigned-deliveries-dashboard/:deliveryId", getAssignedDeliveriesForDashboard);
router.get("/dashboard-summary/:delivery_boy_id", getDeliveryDashboardSummary);
router.get("/schedule/:delivery_boy_id", getDeliverySchedule);
router.get("/search/:delivery_boy_id", searchDeliveries);
router.get("/weeklyPerformance/:delivery_boy_id", getWeeklyPerformance);
router.get("/realTimePerformance/:delivery_boy_id", getRealTimePerformanceMetrics);
router.get("/performanceByPeriod/:delivery_boy_id", getPerformanceByPeriod);

// Abort delivery
router.put("/abortDelivery/:delivery_id", abortDelivery);

// Utility routes
router.post("/fixDeliveryStatusHistory", fixDeliveryStatusHistory);
router.get("/debugDeliveries", debugDeliveries);
router.post("/updatePendingToAssigned", updatePendingDeliveriesToAssigned);
router.post("/updateDeliveryToAssigned", updateDeliveryToAssigned);


export default router;