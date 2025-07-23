import express from 'express';
import {
    getAllReturnRequests,
    approveReturnRequest,
    rejectReturnRequest,
    getReturnRequestStats
} from '../controllers/adminReturnController.js';

const router = express.Router();

// Get all return requests
router.get('/return-requests', getAllReturnRequests);

// Approve return request
router.put('/return-requests/approve', approveReturnRequest);

// Reject return request
router.put('/return-requests/reject', rejectReturnRequest);

// Get return request statistics
router.get('/return-requests/stats', getReturnRequestStats);

export default router;
