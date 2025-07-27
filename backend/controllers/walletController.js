import pool from '../db.js';

// Get user's wallet balance
export const getUserWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user's wallet balance
        const walletQuery = `
            SELECT 
                wallet_id,
                user_id,
                balance,
                created_at,
                updated_at
            FROM "UserWallet" 
            WHERE user_id = $1
        `;

        const walletResult = await pool.query(walletQuery, [userId]);

        if (walletResult.rows.length === 0) {
            // Create wallet if it doesn't exist
            const createWalletQuery = `
                INSERT INTO "UserWallet" (user_id, balance) 
                VALUES ($1, 0.00) 
                RETURNING wallet_id, user_id, balance, created_at, updated_at
            `;
            const newWalletResult = await pool.query(createWalletQuery, [userId]);

            const wallet = newWalletResult.rows[0];
            wallet.balance = parseFloat(wallet.balance);

            return res.json({
                success: true,
                wallet: wallet
            });
        }

        const wallet = walletResult.rows[0];
        wallet.balance = parseFloat(wallet.balance);

        res.json({
            success: true,
            wallet: wallet
        });

    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet balance',
            error: error.message
        });
    }
};

// Get user's wallet with transactions
export const getUserWalletWithTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user's wallet balance
        const walletQuery = `
            SELECT 
                wallet_id,
                user_id,
                balance,
                created_at,
                updated_at
            FROM "UserWallet" 
            WHERE user_id = $1
        `;

        const walletResult = await pool.query(walletQuery, [userId]);

        if (walletResult.rows.length === 0) {
            // Create wallet if it doesn't exist
            const createWalletQuery = `
                INSERT INTO "UserWallet" (user_id, balance) 
                VALUES ($1, 0.00) 
                RETURNING wallet_id, user_id, balance, created_at, updated_at
            `;
            const newWalletResult = await pool.query(createWalletQuery, [userId]);

            const wallet = newWalletResult.rows[0];
            wallet.balance = parseFloat(wallet.balance);

            return res.json({
                success: true,
                wallet: wallet,
                transactions: []
            });
        }

        const wallet = walletResult.rows[0];
        wallet.balance = parseFloat(wallet.balance);

        // Get transactions for this wallet
        const transactionsQuery = `
            SELECT 
                transaction_id,
                transaction_type,
                transaction_category,
                amount,
                balance_before,
                balance_after,
                reference_type,
                reference_id,
                bkash_transaction_id,
                description,
                status,
                created_at
            FROM "WalletTransaction" 
            WHERE wallet_id = $1 
            ORDER BY created_at DESC
            LIMIT 50
        `;

        const transactionsResult = await pool.query(transactionsQuery, [wallet.wallet_id]);
        
        // Convert amount values to float
        const transactions = transactionsResult.rows.map(transaction => ({
            ...transaction,
            amount: parseFloat(transaction.amount),
            balance_before: parseFloat(transaction.balance_before),
            balance_after: parseFloat(transaction.balance_after)
        }));

        res.json({
            success: true,
            wallet: wallet,
            transactions: transactions
        });

    } catch (error) {
        console.error('Error fetching wallet data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet data',
            error: error.message
        });
    }
};

// Add balance to wallet (topup)
export const addWalletBalance = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { user_id, amount, bkash_transaction_id, description } = req.body;

        if (!user_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID and amount are required'
            });
        }

        // Get or create user wallet
        let walletQuery = `
            SELECT wallet_id, balance FROM "UserWallet" WHERE user_id = $1
        `;
        let walletResult = await client.query(walletQuery, [user_id]);

        let wallet;
        if (walletResult.rows.length === 0) {
            // Create wallet if it doesn't exist
            const createWalletQuery = `
                INSERT INTO "UserWallet" (user_id, balance) 
                VALUES ($1, 0.00) 
                RETURNING wallet_id, balance
            `;
            walletResult = await client.query(createWalletQuery, [user_id]);
        }
        
        wallet = walletResult.rows[0];
        const currentBalance = parseFloat(wallet.balance);
        const addAmount = parseFloat(amount);
        const newBalance = currentBalance + addAmount;

        // Update wallet balance
        const updateWalletQuery = `
            UPDATE "UserWallet" 
            SET balance = $1, updated_at = now() 
            WHERE wallet_id = $2
            RETURNING wallet_id, user_id, balance, created_at, updated_at
        `;
        
        const updatedWalletResult = await client.query(updateWalletQuery, [newBalance, wallet.wallet_id]);
        const updatedWallet = updatedWalletResult.rows[0];
        updatedWallet.balance = parseFloat(updatedWallet.balance);

        // Create transaction record
        const transactionQuery = `
            INSERT INTO "WalletTransaction" (
                wallet_id, 
                transaction_type, 
                transaction_category, 
                amount, 
                balance_before, 
                balance_after, 
                reference_type, 
                bkash_transaction_id, 
                description, 
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING transaction_id, created_at
        `;

        const transactionResult = await client.query(transactionQuery, [
            wallet.wallet_id,
            'credit',
            'topup',
            addAmount,
            currentBalance,
            newBalance,
            'topup',
            bkash_transaction_id || null,
            description || 'Wallet top-up',
            'completed'
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Balance added successfully',
            wallet: updatedWallet,
            transaction: {
                transaction_id: transactionResult.rows[0].transaction_id,
                amount: addAmount,
                created_at: transactionResult.rows[0].created_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding wallet balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding wallet balance',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Process wallet payment for an order
export const processWalletPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            user_id,
            amount,
            order_id,
            description = 'Order payment'
        } = req.body;

        if (!user_id || !amount || amount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'User ID and valid amount are required'
            });
        }

        // Get user's wallet
        const walletQuery = `
            SELECT wallet_id, balance FROM "UserWallet" 
            WHERE user_id = $1
        `;
        const walletResult = await client.query(walletQuery, [user_id]);

        if (walletResult.rows.length === 0) {
            // Create wallet if it doesn't exist
            const createWalletQuery = `
                INSERT INTO "UserWallet" (user_id, balance) 
                VALUES ($1, 0.00) 
                RETURNING wallet_id, balance
            `;
            const newWalletResult = await client.query(createWalletQuery, [user_id]);
            const newWallet = newWalletResult.rows[0];
            
            // Check if new wallet has sufficient balance (it won't)
            if (parseFloat(newWallet.balance) < parseFloat(amount)) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance',
                    currentBalance: 0.00,
                    requiredAmount: parseFloat(amount)
                });
            }
        }

        const wallet = walletResult.rows[0];
        const currentBalance = parseFloat(wallet.balance);
        const paymentAmount = parseFloat(amount);

        // Check if user has sufficient balance
        if (currentBalance < paymentAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                currentBalance: currentBalance,
                requiredAmount: paymentAmount
            });
        }

        // Calculate new balance
        const newBalance = currentBalance - paymentAmount;

        // Update wallet balance
        const updateWalletQuery = `
            UPDATE "UserWallet" 
            SET balance = $1, updated_at = now() 
            WHERE wallet_id = $2
            RETURNING wallet_id, user_id, balance, created_at, updated_at
        `;
        
        const updatedWalletResult = await client.query(updateWalletQuery, [newBalance, wallet.wallet_id]);
        const updatedWallet = updatedWalletResult.rows[0];
        updatedWallet.balance = parseFloat(updatedWallet.balance);

        // Create transaction record
        const transactionQuery = `
            INSERT INTO "WalletTransaction" (
                wallet_id, 
                transaction_type, 
                transaction_category, 
                amount, 
                balance_before, 
                balance_after, 
                reference_type, 
                reference_id,
                description, 
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING transaction_id, created_at
        `;

        const transactionResult = await client.query(transactionQuery, [
            wallet.wallet_id,
            'debit',
            'purchase',
            paymentAmount,
            currentBalance,
            newBalance,
            'order',
            order_id || null,
            description,
            'completed'
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Payment processed successfully',
            wallet: updatedWallet,
            transaction: {
                transaction_id: transactionResult.rows[0].transaction_id,
                amount: paymentAmount,
                created_at: transactionResult.rows[0].created_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing wallet payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing wallet payment',
            error: error.message
        });
    } finally {
        client.release();
    }
};
