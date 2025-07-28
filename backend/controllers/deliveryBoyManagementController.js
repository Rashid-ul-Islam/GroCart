import pool from '../db.js';

export const getAllDeliveryBoys = async (req, res) => {
  try {
    const query = `
      SELECT 
  db.user_id,
  u.first_name || ' ' || u.last_name as name,
  u.phone_number,
  db.availability_status,
  db.current_load,
  20 as max_load,
  dr.name as delivery_region,
  db.delivery_region_id,
  db.joined_date,
  COALESCE(total_stats.total_deliveries, 0) as total_deliveries,
  COALESCE(perf.avg_rating, 0) as avg_rating,
  COALESCE(today_stats.today_deliveries, 0) as today_deliveries,
  COALESCE(monthly_stats.monthly_earnings, 0) as monthly_earnings,
  COALESCE(ontime_stats.on_time_rate, 0) as on_time_rate
FROM "DeliveryBoy" db
JOIN "User" u ON db.user_id = u.user_id
JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id

LEFT JOIN (
  SELECT 
    dp.delivery_boy_id,
    ROUND(AVG(dp.customer_rating), 1) as avg_rating
  FROM "DeliveryPerformance" dp
  GROUP BY dp.delivery_boy_id
) perf ON db.user_id = perf.delivery_boy_id

LEFT JOIN (
  SELECT 
    d.delivery_boy_id,
    COUNT(*) as today_deliveries
  FROM "Delivery" d
  JOIN "Order" o ON d.order_id = o.order_id
  WHERE DATE(d.created_at) = CURRENT_DATE
  GROUP BY d.delivery_boy_id
) today_stats ON db.user_id = today_stats.delivery_boy_id

LEFT JOIN (
  SELECT 
    d.delivery_boy_id,
    COUNT(*) as total_deliveries
  FROM "Delivery" d
  JOIN "Order" o ON d.order_id = o.order_id
  GROUP BY d.delivery_boy_id
) total_stats ON db.user_id = total_stats.delivery_boy_id

LEFT JOIN (
  SELECT 
    d.delivery_boy_id,
    COUNT(*) * 30 as monthly_earnings
  FROM "Delivery" d
  JOIN "Order" o ON d.order_id = o.order_id
  WHERE EXTRACT(MONTH FROM d.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM d.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY d.delivery_boy_id
) monthly_stats ON db.user_id = monthly_stats.delivery_boy_id

LEFT JOIN (
  SELECT 
    d.delivery_boy_id,
    ROUND(
  (100.0 * COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END)::numeric / NULLIF(COUNT(*)::numeric, 0)),
  1
)
 AS on_time_rate
  FROM "Delivery" d
  WHERE d.actual_arrival IS NOT NULL AND d.estimated_arrival IS NOT NULL
  GROUP BY d.delivery_boy_id
) ontime_stats ON db.user_id = ontime_stats.delivery_boy_id

ORDER BY db.user_id;

    `;

    const result = await pool.query(query);
    console.log(result.rows);
    res.json({
      success: true,
      data: result.rows.map(row => ({
        userId: row.user_id,
        name: row.name,
        phone: row.phone_number,
        availabilityStatus: row.availability_status,
        currentLoad: row.current_load,
        maxLoad: row.max_load,
        deliveryRegion: row.delivery_region,
        regionId: row.delivery_region_id,
        joinedDate: row.joined_date,
        totalDeliveries: parseInt(row.total_deliveries),
        onTimeRate: parseFloat(row.on_time_rate),
        avgRating: parseFloat(row.avg_rating),
        todayDeliveries: parseInt(row.today_deliveries),
        monthlyEarnings: parseInt(row.monthly_earnings)
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery boys',
      error: error.message
    });
  }
};

// Get delivery boys summary statistics
export const getDeliveryBoyStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE 
                WHEN db.availability_status = 'available' THEN 1
              END) AS available_count,
        COUNT(CASE 
                WHEN db.availability_status = 'busy' OR db.current_load > 20 THEN 1
              END) AS busy_count,
        COUNT(CASE 
                WHEN db.availability_status = 'offline' THEN 1
              END) AS offline_count,
        COALESCE(ROUND(AVG(perf.avg_rating), 1), 0) AS avg_rating
      FROM "DeliveryBoy" db
      LEFT JOIN (
        SELECT 
          dp.delivery_boy_id,
          AVG(dp.customer_rating) AS avg_rating
        FROM "DeliveryPerformance" dp
        GROUP BY dp.delivery_boy_id
      ) perf ON db.user_id = perf.delivery_boy_id;
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        availableCount: parseInt(stats.available_count) || 0,
        busyCount: parseInt(stats.busy_count) || 0,
        offlineCount: parseInt(stats.offline_count) || 0,
        avgRating: parseFloat(stats.avg_rating) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching delivery boy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery boy statistics',
      error: error.message
    });
  }
};

// Get specific delivery boy details
export const getDeliveryBoyById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        db.user_id,
        u.first_name || ' ' || u.last_name as name,
        u.phone_number,
        db.availability_status,
        db.current_load,
        5 as max_load,
        dr.name as delivery_region,
        db.joined_date,
        COALESCE(perf.total_deliveries, 0) as total_deliveries,
        COALESCE(perf.on_time_rate, 0) as on_time_rate,
        COALESCE(perf.avg_rating, 0) as avg_rating,
        COALESCE(today_stats.today_deliveries, 0) as today_deliveries,
        COALESCE(monthly_stats.monthly_earnings, 0) as monthly_earnings
      FROM "DeliveryBoy" db
      JOIN "User" u ON db.user_id = u.user_id
      JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
      LEFT JOIN (
        SELECT 
          dp.delivery_boy_id,
          COUNT(*) as total_deliveries,
          ROUND(AVG(CASE WHEN dp.delivered_on_time THEN 100 ELSE 0 END), 1) as on_time_rate,
          ROUND(AVG(dp.customer_rating), 1) as avg_rating
        FROM "DeliveryPerformance" dp
        GROUP BY dp.delivery_boy_id
      ) perf ON db.user_id = perf.delivery_boy_id
      LEFT JOIN (
        SELECT 
          d.delivery_boy_id,
          COUNT(*) as today_deliveries
        FROM "Delivery" d
        JOIN "Order" o ON d.order_id = o.order_id
        WHERE DATE(d.created_at) = CURRENT_DATE
        GROUP BY d.delivery_boy_id
      ) today_stats ON db.user_id = today_stats.delivery_boy_id
      LEFT JOIN (
        SELECT 
          d.delivery_boy_id,
          COUNT(*) * 1000 as monthly_earnings
        FROM "Delivery" d
        JOIN "Order" o ON d.order_id = o.order_id
        WHERE EXTRACT(MONTH FROM d.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM d.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY d.delivery_boy_id
      ) monthly_stats ON db.user_id = monthly_stats.delivery_boy_id
      WHERE db.user_id = $1;
    `;
    const on_time_query = `SELECT 
  COUNT(*) AS total_completed,
  COUNT(CASE 
           WHEN d.actual_arrival <= d.estimated_arrival THEN 1 
         END) AS on_time_deliveries,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      ROUND(100.0 * COUNT(CASE 
                           WHEN d.actual_arrival <= d.estimated_arrival THEN 1 
                         END) / COUNT(*), 1)
    ELSE 0
  END AS on_time_rate
FROM "Delivery" d
WHERE d.delivery_boy_id = $1
  AND d.actual_arrival IS NOT NULL
  AND d.estimated_arrival IS NOT NULL;
`;
    const result = await pool.query(query, [id]);
    const onTimeResult = await pool.query(on_time_query, [id]);
    console.log(onTimeResult.rows);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    const row = result.rows[0];
    const onTimeRow = onTimeResult.rows[0];
    res.json({
      success: true,
      data: {
        userId: row.user_id,
        name: row.name,
        phone: row.phone_number,
        availabilityStatus: row.availability_status,
        currentLoad: row.current_load,
        maxLoad: row.max_load,
        deliveryRegion: row.delivery_region,
        joinedDate: row.joined_date,
        totalDeliveries: parseInt(row.total_deliveries),
        onTimeRate: parseFloat(onTimeRow.on_time_rate),
        avgRating: parseFloat(row.avg_rating),
        todayDeliveries: parseInt(row.today_deliveries),
        monthlyEarnings: parseInt(row.monthly_earnings)
      }
    });
  } catch (error) {
    console.error('Error fetching delivery boy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery boy details',
      error: error.message
    });
  }
};

// Update delivery boy status
export const updateDeliveryBoyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['available', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: available, busy, offline'
      });
    }

    const query = `
      UPDATE "DeliveryBoy" 
      SET availability_status = $1
      WHERE user_id = $2
      RETURNING user_id, availability_status;
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        userId: result.rows[0].user_id,
        availabilityStatus: result.rows[0].availability_status
      }
    });
  } catch (error) {
    console.error('Error updating delivery boy status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery boy status',
      error: error.message
    });
  }
};

// Create new delivery boy
export const assignDeliveryBoyRole = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      user_id,
      delivery_region_id
    } = req.body;

    // First, check if user exists
    const userCheckQuery = `
      SELECT user_id, username, role_id 
      FROM "User" 
      WHERE user_id = $1;
    `;

    const userCheckResult = await client.query(userCheckQuery, [user_id]);

    if (userCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a delivery boy
    const deliveryBoyCheckQuery = `
      SELECT user_id FROM "DeliveryBoy" WHERE user_id = $1;
    `;

    const deliveryBoyCheckResult = await client.query(deliveryBoyCheckQuery, [user_id]);

    if (deliveryBoyCheckResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'User is already assigned as a delivery boy'
      });
    }

    // Update user role to delivery_boy
    const updateUserQuery = `
      UPDATE "User" 
      SET role_id = 'delivery_boy'
      WHERE user_id = $1
      RETURNING user_id, username, role_id;
    `;

    const userResult = await client.query(updateUserQuery, [user_id]);

    // Create delivery boy record
    const deliveryBoyQuery = `
      INSERT INTO "DeliveryBoy" (user_id, availability_status, current_load, delivery_region_id, joined_date)
      VALUES ($1, 'available', 0, $2, CURRENT_TIMESTAMP)
      RETURNING user_id, availability_status, current_load, delivery_region_id, joined_date;
    `;

    const deliveryBoyResult = await client.query(deliveryBoyQuery, [user_id, delivery_region_id]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'User role updated to delivery boy successfully',
      data: {
        userId: deliveryBoyResult.rows[0].user_id,
        username: userResult.rows[0].username,
        role: userResult.rows[0].role_id,
        availabilityStatus: deliveryBoyResult.rows[0].availability_status,
        currentLoad: deliveryBoyResult.rows[0].current_load,
        deliveryRegionId: deliveryBoyResult.rows[0].delivery_region_id,
        joinedDate: deliveryBoyResult.rows[0].joined_date
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning delivery boy role:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning delivery boy role',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get all users (excluding those who are already delivery boys)
export const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.username,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        u.phone_number,
        u.role_id,
        u.created_at
      FROM "User" u
      LEFT JOIN "DeliveryBoy" db ON u.user_id = db.user_id
      WHERE db.user_id IS NULL 
        AND u.role_id != 'delivery_boy'
      ORDER BY u.created_at DESC;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        user_id: row.user_id,
        username: row.username,
        name: row.name,
        email: row.email,
        phone_number: row.phone_number,
        role_id: row.role_id,
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get all delivery regions
export const getDeliveryRegions = async (req, res) => {
  try {
    const query = `
      SELECT 
        dr.delivery_region_id,
        dr.name,
        dr.latitude,
        dr.longitude,
        w.name as warehouse_name,
        dr.created_at
      FROM "DeliveryRegion" dr
      LEFT JOIN "Warehouse" w ON dr.warehouse_id = w.warehouse_id
      ORDER BY dr.name;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        delivery_region_id: row.delivery_region_id,
        name: row.name,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        warehouse_name: row.warehouse_name,
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery regions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery regions',
      error: error.message
    });
  }
};

// Update delivery boy region
export const updateDeliveryBoyRegion = async (req, res) => {
  try {
    const { userId } = req.params;
    const { delivery_region_id } = req.body;

    // Validate input
    if (!userId || !delivery_region_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID and delivery region ID are required'
      });
    }

    // Check if delivery boy exists
    const checkDeliveryBoyQuery = `
      SELECT user_id FROM "DeliveryBoy" WHERE user_id = $1
    `;
    const deliveryBoyCheck = await pool.query(checkDeliveryBoyQuery, [userId]);

    if (deliveryBoyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    // Check if delivery region exists
    const checkRegionQuery = `
      SELECT delivery_region_id FROM "DeliveryRegion" WHERE delivery_region_id = $1
    `;
    const regionCheck = await pool.query(checkRegionQuery, [delivery_region_id]);

    if (regionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery region not found'
      });
    }

    // Update delivery boy region
    const updateQuery = `
      UPDATE "DeliveryBoy" 
      SET delivery_region_id = $1
      WHERE user_id = $2
      RETURNING user_id, delivery_region_id
    `;
    
    const result = await pool.query(updateQuery, [delivery_region_id, userId]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update delivery boy region'
      });
    }

    // Get updated delivery boy information with region name
    const getUpdatedInfoQuery = `
      SELECT 
        db.user_id,
        u.first_name || ' ' || u.last_name as name,
        dr.name as delivery_region,
        db.delivery_region_id
      FROM "DeliveryBoy" db
      JOIN "User" u ON db.user_id = u.user_id
      JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
      WHERE db.user_id = $1
    `;
    
    const updatedInfo = await pool.query(getUpdatedInfoQuery, [userId]);

    res.status(200).json({
      success: true,
      message: 'Delivery boy region updated successfully',
      data: updatedInfo.rows[0]
    });

  } catch (error) {
    console.error('Error updating delivery boy region:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery boy region',
      error: error.message
    });
  }
};

