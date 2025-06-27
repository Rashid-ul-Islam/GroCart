import express from 'express';
import { 
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkFavorite,
    getFavoritesCount,
    toggleFavorite
} from '../controllers/favoritesController.js';

const router = express.Router();

// Add product to favorites
router.post("/add", addFavorite);

// Remove product from favorites
router.delete("/remove", removeFavorite);

// Get all favorites for a user (user_id as URL parameter)
router.get("/user/:user_id", getUserFavorites);

// Check if product is in user's favorites
router.get("/check/:user_id/:product_id", checkFavorite);

// Get favorites count for a user (user_id as URL parameter)
router.get("/count/:user_id", getFavoritesCount);

// Toggle favorite status
router.post("/toggle", toggleFavorite);

export default router;