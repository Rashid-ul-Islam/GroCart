import {
    createOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatusHandler,
    getActiveOrders,
    getCompletedOrders,
    getCancelledOrders,
    getOrderStats
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
// Get order stats for a user
router.get('/stats/:user_id', getOrderStats);
// Get order details
router.get('/:order_id', getOrderDetails);
// Update order status
router.put('/update/:order_id', updateOrderStatusHandler);
export default router;