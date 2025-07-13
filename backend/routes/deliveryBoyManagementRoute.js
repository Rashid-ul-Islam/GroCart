import express from "express";
import {
    getAllDeliveryBoys,
    getDeliveryBoyById,
    updateDeliveryBoyStatus,
    assignDeliveryBoyRole,
    getAllUsers,
    getDeliveryRegions
} from "../controllers/deliveryBoyManagementController.js";

const router = express.Router();

// Delivery
router.get("/allDeliveryBoys", getAllDeliveryBoys);
router.get("/deliveryBoy/:id", getDeliveryBoyById);
router.put("/updateDeliveryBoyStatus/:id", updateDeliveryBoyStatus);
router.post("/assignDeliveryBoyRole", assignDeliveryBoyRole);
router.get("/allUsers", getAllUsers);
router.get("/deliveryRegions", getDeliveryRegions);

export default router;
