import pool from "../db.js";

// Get user profile by ID
export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone_number,
                u.role_id,
                u.total_points,
                u.created_at,
                u.last_login,
                ut.name as tier_name
            FROM "User" u
            LEFT JOIN "UserTier" ut ON u.tier_id = ut.tier_id
            WHERE u.user_id = $1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove sensitive information
        const userProfile = result.rows[0];
        delete userProfile.password_hash;

        res.status(200).json(userProfile);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { first_name, last_name, email, phone_number, username } = req.body;

        // Check if email or username already exists for another user
        const duplicateCheck = `
            SELECT user_id FROM "User" 
            WHERE (email = $1 OR username = $2) AND user_id != $3
        `;
        const duplicateResult = await pool.query(duplicateCheck, [email, username, userId]);

        if (duplicateResult.rows.length > 0) {
            return res.status(400).json({ error: "Email or username already exists" });
        }

        const updateQuery = `
            UPDATE "User" 
            SET first_name = $1, last_name = $2, email = $3, phone_number = $4, username = $5, updated_at = NOW()
            WHERE user_id = $6
            RETURNING user_id, username, email, first_name, last_name, phone_number, role_id, total_points, created_at
        `;

        const result = await pool.query(updateQuery, [
            first_name, last_name, email, phone_number, username, userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Failed to update user profile" });
    }
};

// Get user statistics including average rating from delivery reviews
export const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get order statistics - using StatusHistory to check for payment_received status
        const orderStatsQuery = `
            SELECT 
                COUNT(DISTINCT o.order_id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM "Order" o
            WHERE o.user_id = $1 
            AND EXISTS (
                SELECT 1 FROM "StatusHistory" sh 
                WHERE sh.entity_type = 'order' 
                AND sh.entity_id = o.order_id 
                AND sh.status = 'payment_received'
            )
        `;

        // Get average customer rating from delivery reviews
        const ratingQuery = `
            SELECT 
                AVG(dr.rating)::DECIMAL(3,2) as avg_rating,
                COUNT(dr.rating) as review_count
            FROM "DeliveryReview" dr
            JOIN "Delivery" d ON dr.delivery_id = d.delivery_id
            JOIN "Order" o ON d.order_id = o.order_id
            WHERE o.user_id = $1
        `;

        // Get user tier information
        const tierQuery = `
            SELECT 
                u.total_points,
                ut.name as tier_name
            FROM "User" u
            LEFT JOIN "UserTier" ut ON u.tier_id = ut.tier_id
            WHERE u.user_id = $1
        `;

        const [orderStats, ratingStats, tierStats] = await Promise.all([
            pool.query(orderStatsQuery, [userId]),
            pool.query(ratingQuery, [userId]),
            pool.query(tierQuery, [userId])
        ]);

        const stats = {
            totalOrders: parseInt(orderStats.rows[0].total_orders) || 0,
            totalSpent: parseFloat(orderStats.rows[0].total_spent) || 0,
            avgRating: parseFloat(ratingStats.rows[0].avg_rating) || 0,
            reviewCount: parseInt(ratingStats.rows[0].review_count) || 0,
            totalPoints: parseInt(tierStats.rows[0]?.total_points) || 0,
            tier: tierStats.rows[0]?.tier_name || null
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Failed to fetch user statistics" });
    }
};

// Get user addresses
export const getUserAddresses = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT 
                a.address_id,
                a.address,
                a."isPrimary",
                a.created_at,
                a.updated_at,
                r.name as region_name,
                r.region_id,
                c.name as city_name,
                d.name as district_name,
                div.name as division_name
            FROM "Address" a
            JOIN "Region" r ON a.region_id = r.region_id
            JOIN "City" c ON r.city_id = c.city_id
            JOIN "District" d ON c.district_id = d.district_id
            JOIN "Division" div ON d.division_id = div.division_id
            WHERE a.user_id = $1
            ORDER BY a."isPrimary" DESC, a.created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Error fetching user addresses:", error);
        res.status(500).json({ error: "Failed to fetch user addresses" });
    }
};

// Add new address
export const addUserAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { user_id, address, region_id, isPrimary } = req.body;

        console.log('Adding user address:', { user_id, address, region_id, isPrimary });

        // Check for duplicate address
        const duplicateCheck = await client.query(
            `SELECT address_id, address FROM "Address" 
             WHERE user_id = $1 AND LOWER(TRIM(address)) = LOWER(TRIM($2)) AND region_id = $3`,
            [user_id, address, region_id]
        );

        console.log('Duplicate check result:', duplicateCheck.rows);

        if (duplicateCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            console.log('Duplicate address found, rejecting');
            return res.status(409).json({
                success: false,
                message: 'This address already exists for your account'
            });
        }

        console.log('No duplicate found, proceeding with insert');

        // If this is set as primary, update all other addresses to not primary
        if (isPrimary) {
            await client.query(
                'UPDATE "Address" SET "isPrimary" = false WHERE user_id = $1',
                [user_id]
            );
        }

        const insertQuery = `
            INSERT INTO "Address" (user_id, address, region_id, "isPrimary", created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING address_id, address, "isPrimary", created_at
        `;

        const result = await client.query(insertQuery, [user_id, address, region_id, isPrimary]);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Address added successfully",
            address: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error adding address:", error);
        res.status(500).json({ error: "Failed to add address" });
    } finally {
        client.release();
    }
};

// Update address
export const updateUserAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { addressId } = req.params;
        const { address, region_id, isPrimary, user_id } = req.body;

        // If this is set as primary, update all other addresses to not primary
        if (isPrimary) {
            await client.query(
                'UPDATE "Address" SET "isPrimary" = false WHERE user_id = $1',
                [user_id]
            );
        }

        const updateQuery = `
            UPDATE "Address" 
            SET address = $1, region_id = $2, "isPrimary" = $3, updated_at = NOW()
            WHERE address_id = $4
            RETURNING address_id, address, "isPrimary", updated_at
        `;

        const result = await client.query(updateQuery, [address, region_id, isPrimary, addressId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Address not found" });
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: "Address updated successfully",
            address: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error updating address:", error);
        res.status(500).json({ error: "Failed to update address" });
    } finally {
        client.release();
    }
};

// Delete address
export const deleteUserAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const deleteQuery = `
            DELETE FROM "Address" 
            WHERE address_id = $1
            RETURNING address_id
        `;

        const result = await pool.query(deleteQuery, [addressId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Address not found" });
        }

        res.status(200).json({
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Failed to delete address" });
    }
};

// Set primary address
export const setPrimaryAddress = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { addressId } = req.params;

        // Get the user_id for this address
        const getUserQuery = 'SELECT user_id FROM "Address" WHERE address_id = $1';
        const userResult = await client.query(getUserQuery, [addressId]);

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Address not found" });
        }

        const userId = userResult.rows[0].user_id;

        // Set all addresses to not primary
        await client.query(
            'UPDATE "Address" SET "isPrimary" = false WHERE user_id = $1',
            [userId]
        );

        // Set the specified address as primary
        await client.query(
            'UPDATE "Address" SET "isPrimary" = true WHERE address_id = $1',
            [addressId]
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: "Primary address updated successfully"
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error setting primary address:", error);
        res.status(500).json({ error: "Failed to set primary address" });
    } finally {
        client.release();
    }
};

// Get all regions for address selection
export const getRegions = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.region_id,
                r.name,
                c.name as city_name,
                d.name as district_name,
                div.name as division_name
            FROM "Region" r
            JOIN "City" c ON r.city_id = c.city_id
            JOIN "District" d ON c.district_id = d.district_id
            JOIN "Division" div ON d.division_id = div.division_id
            ORDER BY div.name, d.name, c.name, r.name
        `;

        const result = await pool.query(query);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Error fetching regions:", error);
        res.status(500).json({ error: "Failed to fetch regions" });
    }
};

// Get delivery boy availability status
export const getDeliveryBoyAvailability = async (req, res) => {
    try {
        const { userId } = req.params;

        // First check if user is a delivery boy
        const userQuery = `
            SELECT role_id 
            FROM "User" 
            WHERE user_id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userResult.rows[0].role_id !== 'delivery_boy') {
            return res.status(403).json({ error: "User is not a delivery boy" });
        }

        // Get delivery boy availability status
        const deliveryBoyQuery = `
            SELECT 
                db.availability_status,
                db.current_load,
                db.delivery_region_id,
                dr.name as region_name
            FROM "DeliveryBoy" db
            LEFT JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
            WHERE db.user_id = $1
        `;

        const deliveryBoyResult = await pool.query(deliveryBoyQuery, [userId]);

        if (deliveryBoyResult.rows.length === 0) {
            return res.status(404).json({ error: "Delivery boy record not found" });
        }

        res.status(200).json({
            availability_status: deliveryBoyResult.rows[0].availability_status,
            current_load: deliveryBoyResult.rows[0].current_load,
            delivery_region_id: deliveryBoyResult.rows[0].delivery_region_id,
            region_name: deliveryBoyResult.rows[0].region_name
        });

    } catch (error) {
        console.error("Error fetching delivery boy availability:", error);
        res.status(500).json({ error: "Failed to fetch delivery boy availability" });
    }
};

// Update delivery boy availability status
export const updateDeliveryBoyAvailability = async (req, res) => {
    try {
        const { userId } = req.params;
        const { availability_status } = req.body;

        // Validate availability_status
        const validStatuses = ['available', 'offline', 'busy', 'on_delivery'];
        if (!validStatuses.includes(availability_status)) {
            return res.status(400).json({ 
                error: "Invalid availability status. Must be one of: " + validStatuses.join(', ')
            });
        }

        // First check if user is a delivery boy
        const userQuery = `
            SELECT role_id 
            FROM "User" 
            WHERE user_id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userResult.rows[0].role_id !== 'delivery_boy') {
            return res.status(403).json({ error: "User is not a delivery boy" });
        }

        // Update delivery boy availability status
        const updateQuery = `
            UPDATE "DeliveryBoy" 
            SET availability_status = $1
            WHERE user_id = $2
            RETURNING availability_status
        `;

        const updateResult = await pool.query(updateQuery, [availability_status, userId]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: "Delivery boy record not found" });
        }

        res.status(200).json({
            message: "Availability status updated successfully",
            availability_status: updateResult.rows[0].availability_status
        });

    } catch (error) {
        console.error("Error updating delivery boy availability:", error);
        res.status(500).json({ error: "Failed to update delivery boy availability" });
    }
};
