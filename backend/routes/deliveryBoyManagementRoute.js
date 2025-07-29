import express from "express";
import {
    getAllDeliveryBoys,
    getDeliveryBoyStats,
    getDeliveryBoyById,
    updateDeliveryBoyStatus,
    assignDeliveryBoyRole,
    getAllUsers,
    getDeliveryRegions,
    updateDeliveryBoyRegion
} from "../controllers/deliveryBoyManagementController.js";

const router = express.Router();

// Delivery
router.get("/allDeliveryBoys", getAllDeliveryBoys);
router.get("/deliveryBoyStats", getDeliveryBoyStats);
router.get("/deliveryBoy/:id", getDeliveryBoyById);
router.put("/updateDeliveryBoyStatus/:id", updateDeliveryBoyStatus);
router.put("/updateDeliveryBoyRegion/:userId", updateDeliveryBoyRegion);
router.post("/assignDeliveryBoyRole", assignDeliveryBoyRole);
router.get("/allUsers", getAllUsers);
router.get("/deliveryRegions", getDeliveryRegions);

export default router;
