import {
    createOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatusHandler
} from '../controllers/orderController.js';

import express from 'express';
const router = express.Router();
// Create new order
router.post('/create', createOrder);
// Get user orders
router.get('/user/:user_id', getUserOrders);
// Get order details
router.get('/:order_id', getOrderDetails);
// Update order status
router.put('/update/:order_id', updateOrderStatusHandler);
export default router;