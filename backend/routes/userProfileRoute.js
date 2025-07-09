import express from "express";
import {
    getUserProfile,
    updateUserProfile,
    getUserStats,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setPrimaryAddress,
    getRegions
} from "../controllers/userProfileController.js";

const router = express.Router();

// User profile routes
router.get("/profile/:userId", getUserProfile);
router.put("/profile/:userId", updateUserProfile);
router.get("/stats/:userId", getUserStats);

// Address routes
router.get("/addresses/:userId", getUserAddresses);
router.post("/addresses", addUserAddress);
router.put("/addresses/:addressId", updateUserAddress);
router.delete("/addresses/:addressId", deleteUserAddress);
router.put("/addresses/primary/:addressId", setPrimaryAddress);

// Utility routes
router.get("/regions", getRegions);

export default router;
