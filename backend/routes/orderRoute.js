import {
    createOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatusHandler,
    getActiveOrders,
    getCompletedOrders,
    getCancelledOrders,
    cancelOrder,
    getOrderStats,
    calculateShippingAndDelivery,
    getOrderItemsForReturn,
    createReturnRequest,
    getUserReturnRequests
} from '../controllers/orderController.js';

import express from 'express';
const router = express.Router();
// Create new order
router.post('/create', createOrder);
// Get user orders
router.get('/user/:user_id', getUserOrders);
// Get active orders
router.get('/active/:user_id', getActiveOrders);
// Get completed orders
router.get('/completed/:user_id', getCompletedOrders);
// Get cancelled orders
router.get('/cancelled/:user_id', getCancelledOrders);
// Cancel order
router.put('/cancel/:order_id', cancelOrder);
// Get order stats for a user
router.get('/stats/:user_id', getOrderStats);
// Get order details
router.get('/:order_id', getOrderDetails);
// Update order status
router.put('/update/:order_id', updateOrderStatusHandler);
// Calculate shipping and delivery
router.get('/calculate-shipping/:user_id', calculateShippingAndDelivery);

// Return request routes
router.get('/return-items/:order_id', getOrderItemsForReturn);
router.post('/return-request', createReturnRequest);
router.get('/return-requests/:user_id', getUserReturnRequests);

export default router;