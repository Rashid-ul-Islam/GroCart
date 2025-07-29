import express from 'express';
import { getUserWalletBalance, getUserWalletWithTransactions, addWalletBalance, processWalletPayment } from '../controllers/walletController.js';

const router = express.Router();

// Get user wallet balance only
router.get('/balance/:userId', getUserWalletBalance);

router.get('/:userId', getUserWalletWithTransactions);

// Add balance to wallet (topup)
router.post('/topup', addWalletBalance);

// Process wallet payment for orders
router.post('/payment', processWalletPayment);

export default router;
