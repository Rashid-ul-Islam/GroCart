import pool from '../db.js';

// Get all coupons with pagination and filters
export const getCoupons = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            discount_type,
            tier
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramCount = 0;

        // Build where conditions based on filters
        if (status) {
            if (status === 'active') {
                whereConditions.push(`c.is_active = true AND c.end_date > NOW()`);
            } else if (status === 'inactive') {
                whereConditions.push(`c.is_active = false`);
            } else if (status === 'expired') {
                whereConditions.push(`c.end_date <= NOW()`);
            }
        }

        if (discount_type) {
            paramCount++;
            whereConditions.push(`c.discount_type = $${paramCount}`);
            queryParams.push(discount_type);
        }

        if (tier) {
            paramCount++;
            whereConditions.push(`c.applied_tiers = $${paramCount}`);
            queryParams.push(tier);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Count total coupons
        const countQuery = `
      SELECT COUNT(*) as total
      FROM "Coupon" c
      ${whereClause}
    `;

        const countResult = await pool.query(countQuery, queryParams);
        const totalCoupons = parseInt(countResult.rows[0].total);

        // Get coupons with pagination
        paramCount++;
        queryParams.push(limit);
        paramCount++;
        queryParams.push(offset);

        const query = `
      SELECT 
        c.*,
        ut.name as tier_name
      FROM "Coupon" c
      LEFT JOIN "UserTier" ut ON c.applied_tiers = ut.tier_id
      ${whereClause}
      ORDER BY c.coupon_id DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

        const result = await pool.query(query, queryParams);
        const totalPages = Math.ceil(totalCoupons / limit);

        res.json({
            coupons: result.rows,
            currentPage: parseInt(page),
            totalPages,
            totalCoupons,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });

    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            message: 'Error fetching coupons',
            error: error.message
        });
    }
};

// Search coupons by code or description
export const searchCoupons = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.json({ coupons: [] });
        }

        const query = `
      SELECT 
        c.*,
        ut.name as tier_name
      FROM "Coupon" c
      LEFT JOIN "UserTier" ut ON c.applied_tiers = ut.tier_id
      WHERE 
        LOWER(c.code) LIKE LOWER($1) OR 
        LOWER(c.description) LIKE LOWER($1)
      ORDER BY c.coupon_id DESC
      LIMIT 20
    `;

        const searchTerm = `%${search}%`;
        const result = await pool.query(query, [searchTerm]);

        res.json({ coupons: result.rows });

    } catch (error) {
        console.error('Error searching coupons:', error);
        res.status(500).json({
            message: 'Error searching coupons',
            error: error.message
        });
    }
};

// Get user tiers for dropdown
export const getUserTiers = async (req, res) => {
    try {
        const query = `
      SELECT tier_id, name, min_points, max_points
      FROM "UserTier"
      ORDER BY min_points ASC
    `;

        const result = await pool.query(query);
        res.json({ tiers: result.rows });

    } catch (error) {
        console.error('Error fetching user tiers:', error);
        res.status(500).json({
            message: 'Error fetching user tiers',
            error: error.message
        });
    }
};

// Get available coupons for a specific user based on their tier
export const getAvailableCoupons = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: 'User ID is required'
            });
        }

        // Get user's tier
        const userQuery = `
            SELECT u.tier_id, ut.name as tier_name 
            FROM "User" u
            LEFT JOIN "UserTier" ut ON u.tier_id = ut.tier_id
            WHERE u.user_id = $1
        `;

        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Get available coupons (active, not expired, has usage left, matches user tier or no tier restriction)
        const couponsQuery = `
            SELECT 
                c.coupon_id,
                c.code,
                c.description,
                c.discount_type,
                c.discount_value,
                c.min_purchase,
                c.max_discount,
                c.start_date,
                c.end_date,
                c.usage_limit,
                c.usage_count,
                c.applied_tiers,
                ut.name as tier_name
            FROM "Coupon" c
            LEFT JOIN "UserTier" ut ON c.applied_tiers = ut.tier_id
            WHERE c.is_active = true 
                AND c.start_date <= NOW() 
                AND c.end_date > NOW()
                AND (c.usage_limit IS NULL OR c.usage_count < c.usage_limit)
                AND (c.applied_tiers IS NULL OR c.applied_tiers = $1)
            ORDER BY 
                CASE 
                    WHEN c.discount_type = 'percentage' THEN c.discount_value 
                    ELSE c.discount_value 
                END DESC
        `;

        const couponsResult = await pool.query(couponsQuery, [user.tier_id]);

        res.json({
            message: 'Available coupons retrieved successfully',
            coupons: couponsResult.rows,
            userTier: user.tier_name || 'No tier'
        });

    } catch (error) {
        console.error('Error fetching available coupons:', error);
        res.status(500).json({
            message: 'Error fetching available coupons',
            error: error.message
        });
    }
};

// Create new coupon
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_purchase,
            max_discount,
            start_date,
            end_date,
            is_active,
            usage_limit,
            applied_tiers
        } = req.body;

        // Validation
        if (!code || !discount_value || !start_date || !end_date) {
            return res.status(400).json({
                message: 'Code, discount value, start date, and end date are required'
            });
        }

        if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
            return res.status(400).json({
                message: 'Percentage discount must be between 0 and 100'
            });
        }

        if (discount_type === 'fixed' && discount_value < 0) {
            return res.status(400).json({
                message: 'Fixed discount value cannot be negative'
            });
        }

        if (new Date(end_date) <= new Date(start_date)) {
            return res.status(400).json({
                message: 'End date must be after start date'
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await pool.query(
            'SELECT coupon_id FROM "Coupon" WHERE code = $1',
            [code]
        );

        if (existingCoupon.rows.length > 0) {
            return res.status(400).json({
                message: 'Coupon code already exists'
            });
        }

        const query = `
      INSERT INTO "Coupon" (
        code, description, discount_type, discount_value,
        min_purchase, max_discount, start_date, end_date,
        is_active, usage_limit, applied_tiers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

        const values = [
            code.toUpperCase(),
            description || `${discount_value}${discount_type === 'percentage' ? '%' : '$'} discount coupon`,
            discount_type,
            discount_value,
            min_purchase || null,
            max_discount || null,
            start_date,
            end_date,
            is_active !== undefined ? is_active : true,
            usage_limit || null,
            applied_tiers || null
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating coupon:', error);
        if (error.code === '23505') { // Duplicate key error
            res.status(400).json({
                message: 'Coupon code already exists'
            });
        } else {
            res.status(500).json({
                message: 'Error creating coupon',
                error: error.message
            });
        }
    }
};

// Update coupon
export const updateCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_purchase,
            max_discount,
            start_date,
            end_date,
            is_active,
            usage_limit,
            applied_tiers
        } = req.body;

        // Validation
        if (!code || !discount_value || !start_date || !end_date) {
            return res.status(400).json({
                message: 'Code, discount value, start date, and end date are required'
            });
        }

        if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
            return res.status(400).json({
                message: 'Percentage discount must be between 0 and 100'
            });
        }

        if (discount_type === 'fixed' && discount_value < 0) {
            return res.status(400).json({
                message: 'Fixed discount value cannot be negative'
            });
        }

        if (new Date(end_date) <= new Date(start_date)) {
            return res.status(400).json({
                message: 'End date must be after start date'
            });
        }

        // Check if coupon exists
        const existingCoupon = await pool.query(
            'SELECT * FROM "Coupon" WHERE coupon_id = $1',
            [couponId]
        );

        if (existingCoupon.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check if code is being changed and if new code already exists
        if (code !== existingCoupon.rows[0].code) {
            const duplicateCheck = await pool.query(
                'SELECT coupon_id FROM "Coupon" WHERE code = $1 AND coupon_id != $2',
                [code, couponId]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({
                    message: 'Coupon code already exists'
                });
            }
        }

        const query = `
      UPDATE "Coupon" 
      SET code = $1, description = $2, discount_type = $3, discount_value = $4,
          min_purchase = $5, max_discount = $6, start_date = $7, end_date = $8,
          is_active = $9, usage_limit = $10, applied_tiers = $11
      WHERE coupon_id = $12
      RETURNING *
    `;

        const values = [
            code.toUpperCase(),
            description,
            discount_type,
            discount_value,
            min_purchase || null,
            max_discount || null,
            start_date,
            end_date,
            is_active,
            usage_limit || null,
            applied_tiers || null,
            couponId
        ];

        const result = await pool.query(query, values);

        res.json({
            message: 'Coupon updated successfully',
            coupon: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating coupon:', error);
        if (error.code === '23505') { // Duplicate key error
            res.status(400).json({
                message: 'Coupon code already exists'
            });
        } else {
            res.status(500).json({
                message: 'Error updating coupon',
                error: error.message
            });
        }
    }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        // First check if coupon exists
        const existingCoupon = await pool.query(
            'SELECT * FROM "Coupon" WHERE coupon_id = $1',
            [couponId]
        );

        if (existingCoupon.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check if coupon has been used
        const usageQuery = `
      SELECT COUNT(*) as usage_count
      FROM "OrderCoupon" 
      WHERE coupon_id = $1
    `;

        const usageResult = await pool.query(usageQuery, [couponId]);
        const usageCount = parseInt(usageResult.rows[0].usage_count);

        if (usageCount > 0) {
            // If coupon has been used, just deactivate it instead of deleting
            const deactivateQuery = `
        UPDATE "Coupon" 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE coupon_id = $1
        RETURNING *
      `;

            await pool.query(deactivateQuery, [couponId]);

            return res.json({
                message: 'Coupon has been used in orders and has been deactivated instead of deleted',
                action: 'deactivated'
            });
        }

        // Delete the coupon if it hasn't been used
        const deleteQuery = 'DELETE FROM "Coupon" WHERE coupon_id = $1';
        await pool.query(deleteQuery, [couponId]);

        res.json({
            message: 'Coupon deleted successfully',
            action: 'deleted'
        });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            message: 'Error deleting coupon',
            error: error.message
        });
    }
};

// Get single coupon by ID
export const getCouponById = async (req, res) => {
    try {
        const { couponId } = req.params;

        const query = `
      SELECT 
        c.*,
        ut.name as tier_name
      FROM "Coupon" c
      LEFT JOIN "UserTier" ut ON c.applied_tiers = ut.tier_id
      WHERE c.coupon_id = $1
    `;

        const result = await pool.query(query, [couponId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ coupon: result.rows[0] });

    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({
            message: 'Error fetching coupon',
            error: error.message
        });
    }
};

// Validate coupon for use (for customer checkout)
export const validateCoupon = async (req, res) => {
    try {
        const { code, userId, orderAmount } = req.body;

        if (!code || !userId || orderAmount === undefined || orderAmount === null) {
            return res.status(400).json({
                message: 'Coupon code, user ID, and order amount are required',
                valid: false
            });
        }

        // Validate orderAmount is a valid number
        const numericOrderAmount = parseFloat(orderAmount);
        if (isNaN(numericOrderAmount) || numericOrderAmount <= 0) {
            return res.status(400).json({
                message: 'Order amount must be a valid positive number',
                valid: false
            });
        }

        // Get coupon details
        const couponQuery = `
      SELECT c.*, ut.name as tier_name
      FROM "Coupon" c
      LEFT JOIN "UserTier" ut ON c.applied_tiers = ut.tier_id
      WHERE UPPER(c.code) = UPPER($1)
    `;

        const couponResult = await pool.query(couponQuery, [code]);

        if (couponResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Invalid coupon code',
                valid: false
            });
        }

        const coupon = couponResult.rows[0];

        // Check if coupon is active
        if (!coupon.is_active) {
            return res.status(400).json({
                message: 'This coupon is not active',
                valid: false
            });
        }

        // Check if coupon is within valid date range
        const now = new Date();
        const startDate = new Date(coupon.start_date);
        const endDate = new Date(coupon.end_date);

        if (now < startDate) {
            return res.status(400).json({
                message: 'This coupon is not yet valid',
                valid: false
            });
        }

        if (now > endDate) {
            return res.status(400).json({
                message: 'This coupon has expired',
                valid: false
            });
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({
                message: 'This coupon has reached its usage limit',
                valid: false
            });
        }

        // Check minimum purchase requirement
        if (coupon.min_purchase && numericOrderAmount < parseFloat(coupon.min_purchase)) {
            return res.status(400).json({
                message: `Minimum purchase of $${coupon.min_purchase} required for this coupon`,
                valid: false
            });
        }

        // Check user tier requirement
        if (coupon.applied_tiers) {
            const userQuery = `
        SELECT tier_id FROM "User" WHERE user_id = $1
      `;
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'User not found',
                    valid: false
                });
            }

            const userTierId = userResult.rows[0].tier_id;
            if (userTierId !== coupon.applied_tiers) {
                return res.status(400).json({
                    message: `This coupon is only available for ${coupon.tier_name} tier users`,
                    valid: false
                });
            }
        }

        // Calculate discount amount
        let discountAmount;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (numericOrderAmount * parseFloat(coupon.discount_value)) / 100;
        } else {
            discountAmount = parseFloat(coupon.discount_value);
        }

        // Ensure discountAmount is a valid number
        if (isNaN(discountAmount)) {
            discountAmount = 0;
        }

        // Apply maximum discount limit if set
        if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
            discountAmount = parseFloat(coupon.max_discount);
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > numericOrderAmount) {
            discountAmount = numericOrderAmount;
        }

        res.json({
            message: 'Coupon is valid',
            valid: true,
            coupon: {
                coupon_id: coupon.coupon_id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                discount_amount: parseFloat(discountAmount.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            message: 'Error validating coupon',
            error: error.message,
            valid: false
        });
    }
};

// Toggle coupon active status
export const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;

        // First check if coupon exists
        const existingCoupon = await pool.query(
            'SELECT * FROM "Coupon" WHERE coupon_id = $1',
            [couponId]
        );

        if (existingCoupon.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const coupon = existingCoupon.rows[0];
        const newStatus = !coupon.is_active;

        // Update the status
        const updateQuery = `
            UPDATE "Coupon" 
            SET is_active = $1
            WHERE coupon_id = $2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [newStatus, couponId]);

        res.json({
            message: `Coupon ${newStatus ? 'enabled' : 'disabled'} successfully`,
            coupon: result.rows[0],
            status: newStatus ? 'enabled' : 'disabled'
        });

    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).json({
            message: 'Error toggling coupon status',
            error: error.message
        });
    }
};

// Apply coupon to order (increment usage count and create OrderCoupon record)
export const applyCouponToOrder = async (req, res) => {
    try {
        const { orderId, couponId, discountAmount } = req.body;

        if (!orderId || !couponId || discountAmount === undefined) {
            return res.status(400).json({
                message: 'Order ID, coupon ID, and discount amount are required'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Increment coupon usage count
            const updateCouponQuery = `
                UPDATE "Coupon" 
                SET usage_count = usage_count + 1 
                WHERE coupon_id = $1 
                RETURNING *
            `;

            const couponResult = await client.query(updateCouponQuery, [couponId]);

            if (couponResult.rows.length === 0) {
                throw new Error('Coupon not found');
            }

            // Create OrderCoupon record
            const insertOrderCouponQuery = `
                INSERT INTO "OrderCoupon" (order_id, coupon_id, discount_amount)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const orderCouponResult = await client.query(insertOrderCouponQuery, [
                orderId,
                couponId,
                discountAmount
            ]);

            await client.query('COMMIT');

            res.json({
                message: 'Coupon applied to order successfully',
                updatedCoupon: couponResult.rows[0],
                orderCoupon: orderCouponResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error applying coupon to order:', error);
        res.status(500).json({
            message: 'Error applying coupon to order',
            error: error.message
        });
    }
};
