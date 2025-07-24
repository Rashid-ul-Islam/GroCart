import express from 'express';
import * as couponController from '../controllers/couponController.js';

const router = express.Router();

// Get all coupons with pagination and filters
router.get('/', couponController.getCoupons);

// Search coupons
router.get('/search', couponController.searchCoupons);

// Get user tiers for dropdown
router.get('/tiers', couponController.getUserTiers);

// Validate coupon for use
router.post('/validate', couponController.validateCoupon);

// Get single coupon by ID
router.get('/:couponId', couponController.getCouponById);

// Create new coupon
router.post('/', couponController.createCoupon);

// Update coupon
router.put('/:couponId', couponController.updateCoupon);

// Toggle coupon status (enable/disable)
router.patch('/:couponId/toggle-status', couponController.toggleCouponStatus);

// Delete coupon
router.delete('/:couponId', couponController.deleteCoupon);

export default router;
