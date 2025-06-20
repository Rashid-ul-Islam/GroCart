import express from "express";
import { 
  getProductCount,
  getUserCount,
  getDashboardStats
} from "../controllers/adminPanelController.js";

const router = express.Router();

router.get("/getProductCount", getProductCount);
router.get("/getUserCount", getUserCount);
router.get("/getDashboardStats", getDashboardStats);

export default router;
