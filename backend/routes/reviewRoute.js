import express from 'express';
import {
    submitDeliveryReview,
    checkDeliveryReviewExists,
    submitProductReview,
    checkProductReviewExists,
    getProductReviews
} from '../controllers/reviewController.js';

const router = express.Router();

// Submit delivery boy review
router.post('/delivery', submitDeliveryReview);

// Check if delivery review exists for an order
router.get('/delivery-check/:order_id', checkDeliveryReviewExists);

// Submit product review
router.post('/', submitProductReview);

// Check if product review exists for an order
router.get('/product-check/:order_id', checkProductReviewExists);

// Get reviews for a specific product
router.get('/product/:product_id', getProductReviews);

export default router;
