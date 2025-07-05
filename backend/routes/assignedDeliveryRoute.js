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
    getPerformanceByPeriod

} from "../controllers/assignedDeliveryController.js";

const router = express.Router();

// Assigned Delivery Routes
router.get("/getAssignedDeliveries/:delivery_boy_id", getAssignedDeliveries);
router.put("/markDeliveryCompleted/:deliveryId", markDeliveryCompleted);
router.post("/reportDeliveryIssue/:deliveryId", reportDeliveryIssue);
router.get("/deliveryBoyProfile/:deliveryBoyId", getDeliveryBoyProfile);
router.get("/deliveryBoyStats/:deliveryBoyId", getDeliveryBoyStats);
router.get("/deliveryPerformanceMetrics/:deliveryBoyId", getDeliveryPerformanceMetrics);
router.get("/deliveryReviews/:deliveryBoyId", getDeliveryReviews);
router.get("/deliveryBoyEarnings/:deliveryBoyId", getDeliveryBoyEarnings);
// Add these new routes
router.get("/assigned-deliveries-dashboard/:deliveryId", getAssignedDeliveriesForDashboard);
router.get("/dashboard-summary/:delivery_boy_id", getDeliveryDashboardSummary);
router.get("/schedule/:delivery_boy_id", getDeliverySchedule);
router.get("/search/:delivery_boy_id", searchDeliveries);
router.get("/weeklyPerformance/:deliveryId", getWeeklyPerformance);
router.get("/realTimePerformance/:deliveryId", getRealTimePerformanceMetrics);
router.get("/performanceByPeriod/:deliveryId", getPerformanceByPeriod);


export default router;