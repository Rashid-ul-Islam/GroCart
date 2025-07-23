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
