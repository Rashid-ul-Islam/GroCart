import pool from '../db.js';

// Get all return requests for admin
export const getAllReturnRequests = async (req, res) => {
    try {
        const query = `
      SELECT 
        rr.return_id,
        rr.reason,
        rr.status,
        rr.requested_at,
        rr.approved_at,
        rr.rejected_at,
        rr.refund_amount,
        rr.comments,
        rr.processed_by,
        oi.order_id,
        oi.quantity,
        oi.price,
        p.product_id,
        p.name as product_name,
        u.user_id,
        u.username,
        u.email,
        o.order_date,
        admin_user.username as processed_by_admin
      FROM "ReturnRequest" rr
      JOIN "OrderItem" oi ON rr.order_item_id = oi.order_item_id
      JOIN "Product" p ON oi.product_id = p.product_id
      JOIN "User" u ON rr.user_id = u.user_id
      JOIN "Order" o ON oi.order_id = o.order_id
      LEFT JOIN "User" admin_user ON rr.processed_by = admin_user.user_id
      ORDER BY rr.requested_at DESC
    `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching return requests',
            error: error.message
        });
    }
};

// Approve return request and add refund to user's wallet
export const approveReturnRequest = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { return_id, refund_amount, admin_id } = req.body;

        if (!return_id || !refund_amount || refund_amount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Return ID and valid refund amount are required'
            });
        }

        if (!admin_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Admin ID is required'
            });
        }

        // Verify that the admin_id exists in the User table
        const adminCheckQuery = 'SELECT user_id FROM "User" WHERE user_id = $1';
        const adminCheckResult = await client.query(adminCheckQuery, [admin_id]);

        if (adminCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Invalid admin user ID'
            });
        }

        // Get return request details
        const returnQuery = `
      SELECT 
        rr.return_id,
        rr.user_id,
        rr.status,
        oi.price,
        oi.quantity,
        p.name as product_name
      FROM "ReturnRequest" rr
      JOIN "OrderItem" oi ON rr.order_item_id = oi.order_item_id
      JOIN "Product" p ON oi.product_id = p.product_id
      WHERE rr.return_id = $1
    `;

        const returnResult = await client.query(returnQuery, [return_id]);

        if (returnResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Return request not found'
            });
        }

        const returnRequest = returnResult.rows[0];

        if (returnRequest.status !== 'Requested') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Return request has already been processed'
            });
        }

        // Validate refund amount doesn't exceed original price
        const maxRefund = parseFloat(returnRequest.price) * parseInt(returnRequest.quantity);
        if (parseFloat(refund_amount) > maxRefund) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Refund amount cannot exceed original price: ৳${maxRefund.toFixed(2)}`
            });
        }

        // Check if user has a wallet, create if not exists
        const walletQuery = `
      INSERT INTO "UserWallet" (user_id, balance) 
      VALUES ($1, 0.00) 
      ON CONFLICT (user_id) DO NOTHING
      RETURNING wallet_id
    `;
        await client.query(walletQuery, [returnRequest.user_id]);

        // Get user's current wallet
        const getCurrentWalletQuery = `
      SELECT wallet_id, balance FROM "UserWallet" WHERE user_id = $1
    `;
        const walletResult = await client.query(getCurrentWalletQuery, [returnRequest.user_id]);
        const wallet = walletResult.rows[0];

        const currentBalance = parseFloat(wallet.balance);
        const newBalance = currentBalance + parseFloat(refund_amount);

        // Update wallet balance
        const updateWalletQuery = `
      UPDATE "UserWallet" 
      SET balance = $1, updated_at = now()
      WHERE wallet_id = $2
    `;
        await client.query(updateWalletQuery, [newBalance, wallet.wallet_id]);

        // Create wallet transaction record
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
      ) VALUES ($1, 'credit', 'refund', $2, $3, $4, 'return_request', $5, $6, 'completed')
    `;

        const description = `Refund for returned product: ${returnRequest.product_name}`;
        await client.query(transactionQuery, [
            wallet.wallet_id,
            refund_amount,
            currentBalance,
            newBalance,
            return_id,
            description
        ]);

        // Update return request status
        const updateReturnQuery = `
      UPDATE "ReturnRequest" 
      SET 
        status = 'Approved',
        refund_amount = $1,
        approved_at = now(),
        processed_by = $2
      WHERE return_id = $3
    `;
        await client.query(updateReturnQuery, [refund_amount, admin_id, return_id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Return request approved successfully. ৳${refund_amount} has been added to the user's wallet.`,
            data: {
                return_id: return_id,
                refund_amount: refund_amount,
                new_wallet_balance: newBalance
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving return request:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving return request',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Reject return request
export const rejectReturnRequest = async (req, res) => {
    try {
        const { return_id, rejection_reason, admin_id } = req.body;

        if (!return_id || !rejection_reason) {
            return res.status(400).json({
                success: false,
                message: 'Return ID and rejection reason are required'
            });
        }

        if (!admin_id) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID is required'
            });
        }

        // Verify that the admin_id exists in the User table
        const adminCheckQuery = 'SELECT user_id FROM "User" WHERE user_id = $1';
        const adminCheckResult = await pool.query(adminCheckQuery, [admin_id]);

        if (adminCheckResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin user ID'
            });
        }

        // Check if return request exists and is still pending
        const checkQuery = `
      SELECT return_id, status FROM "ReturnRequest" WHERE return_id = $1
    `;
        const checkResult = await pool.query(checkQuery, [return_id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Return request not found'
            });
        }

        if (checkResult.rows[0].status !== 'Requested') {
            return res.status(400).json({
                success: false,
                message: 'Return request has already been processed'
            });
        }

        // Update return request status
        const updateQuery = `
      UPDATE "ReturnRequest" 
      SET 
        status = 'Rejected',
        rejected_at = now(),
        comments = $1,
        processed_by = $2
      WHERE return_id = $3
    `;
        await pool.query(updateQuery, [rejection_reason, admin_id, return_id]);

        res.json({
            success: true,
            message: 'Return request rejected successfully',
            data: {
                return_id: return_id,
                rejection_reason: rejection_reason
            }
        });

    } catch (error) {
        console.error('Error rejecting return request:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting return request',
            error: error.message
        });
    }
};

// Get return request statistics for dashboard
export const getReturnRequestStats = async (req, res) => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'Requested' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_requests,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN refund_amount ELSE 0 END), 0) as total_refunded
      FROM "ReturnRequest"
    `;

        const result = await pool.query(statsQuery);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching return request stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching return request statistics',
            error: error.message
        });
    }
};
