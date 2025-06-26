import express from "express";
import {
  getActiveDeliveries,
  updateDeliveryStatus,
    getDeliveryDetails
} from "../controllers/ActiveDeliveryController.js";

const router = express.Router();

router.get("/activeDeliveries", getActiveDeliveries);
router.put("/upDelStatus/:deliveryId", updateDeliveryStatus);
router.get("/deliveryDetails/:deliveryId", getDeliveryDetails);

export default router;