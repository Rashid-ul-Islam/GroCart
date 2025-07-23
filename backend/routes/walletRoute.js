import express from 'express';
import { getUserWalletBalance } from '../controllers/walletController.js';

const router = express.Router();

// Get user wallet balance
router.get('/:userId', getUserWalletBalance);

export default router;
