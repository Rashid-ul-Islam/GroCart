import express from 'express';
import { getUserWalletBalance, getUserWalletWithTransactions, addWalletBalance } from '../controllers/walletController.js';

const router = express.Router();

// Get user wallet balance only
router.get('/:userId', getUserWalletWithTransactions);

// Add balance to wallet (topup)
router.post('/topup', addWalletBalance);

export default router;
