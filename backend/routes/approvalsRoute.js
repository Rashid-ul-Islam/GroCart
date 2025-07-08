import express from 'express';
import {
    getPendingProductApprovals,
    getPendingWarehouseTransfers,
    approveProductFetch,
    approveWarehouseTransfer
} from '../controllers/approvalsController.js';

const router = express.Router();

// Get pending product fetch approvals
router.get('/pending-product-approvals', getPendingProductApprovals);

// Get pending warehouse transfer requests
router.get('/pending-warehouse-transfers', getPendingWarehouseTransfers);

// Approve/Reject product fetch request
router.post('/approve-product-fetch/:deliveryId/:productId', approveProductFetch);

// Approve/Reject warehouse transfer request  
router.post('/approve-warehouse-transfer/:transferId', approveWarehouseTransfer);

export default router;
