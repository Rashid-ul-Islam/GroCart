import express from 'express';
import {
    getEnhancedAssignedDeliveries,
    startProductFetching,
    markProductsFetched,
    startDelivery,
    requestProductFromWarehouse
} from '../controllers/enhancedDeliveryController.js';

const router = express.Router();

// Get enhanced assigned deliveries
router.get('/enhanced/:delivery_boy_id', getEnhancedAssignedDeliveries);

// Start product fetching process
router.put('/enhanced/:deliveryId/start-fetching', startProductFetching);

// Mark products as fetched
router.put('/enhanced/:deliveryId/mark-fetched', markProductsFetched);

// Mark products as fetched (alternative endpoint name for frontend compatibility)
router.put('/enhanced/:deliveryId/products-fetched', markProductsFetched);

// Start delivery to customer
router.put('/enhanced/:deliveryId/start-delivery', startDelivery);

// Request product from nearest warehouse
router.post('/enhanced/:deliveryId/request-product', requestProductFromWarehouse);

export default router;
